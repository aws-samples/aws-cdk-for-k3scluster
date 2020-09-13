import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as cr from '@aws-cdk/custom-resources';
import * as path from 'path';

const DEFAULT_INSTANCE_TYPE = ec2.InstanceType.of(ec2.InstanceClass.M6G, ec2.InstanceSize.MEDIUM)

let PriceMap:Map<string, string> = new Map([
  ['m6g.medium', '0.0385'],
  ['m6g.large', '0.077'],
]);

export interface ClusterProps {
  /**
   * VPC
   */
  readonly vpc?: ec2.IVpc;

  /**
   * Run worker nodes as EC2 Spot
   */
  readonly spotWorkerNodes?: boolean;

  /**
   * control plane node ec2 instance type
   */
  readonly controlPlaneInstanceType?: ec2.InstanceType;
    
  /**
   * worker node instance type
   */
  readonly workerInstanceType?: ec2.InstanceType;

  /**
   * minimal number of worker nodes
   * 
   * @default 3
   */
  readonly workerMinCapacity?: number;

  /**
   * bucket Removal Policy
   * 
   * @default - cdk.RemovalPolicy.RETAIN
   */
  readonly bucketRemovalPolicy?: cdk.RemovalPolicy;

}

/**
 * Represents the k3sCluster construct
 */
export class Cluster extends cdk.Construct {
  /**
   * The instance type of the control plane
   */
  readonly controlPlaneInstanceType: ec2.InstanceType;

  /**
   * The instance type of the worker node
   */
  readonly workerInstanceType: ec2.InstanceType;
  
  /**
   * The endpoint URL of the control plan
   */
  readonly endpointUri: string;

  constructor(scope: cdk.Construct, id: string, props: ClusterProps = {}) {
    super(scope, id);

    // VPC configuration
    const vpc = props.vpc ?? new ec2.Vpc(this, 'Vpc', { maxAzs:3, natGateways: 1})
    
    // S3 bucket to host K3s token + kubeconfig file 
    const k3sBucket = new s3.Bucket(this, 'k3sBucket', {
      removalPolicy: props.bucketRemovalPolicy ?? cdk.RemovalPolicy.RETAIN,
    });

    // Delete S3 Object CustomResource
    if(props.bucketRemovalPolicy === cdk.RemovalPolicy.DESTROY){
      const onEvent = new lambda.Function(this, 'onEventHandler', {
        runtime: lambda.Runtime.PYTHON_3_8,
        code: lambda.Code.fromAsset(path.join(__dirname, '../custom-resource-handler')),
        handler: 'index.on_event',
      });
  
      const deleteS3ObjectProvider = new cr.Provider(this, 'deleteS3ObjectProvider', {
        onEventHandler: onEvent,
        logRetention: logs.RetentionDays.ONE_DAY,
      });
  
      const CRdeleteS3ObjectProvider = new cdk.CustomResource(this, 'CRdeleteS3ObjectProvider', {
        serviceToken: deleteS3ObjectProvider.serviceToken,
        properties: {
          Bucket: k3sBucket.bucketName,
        },
      });
  
      CRdeleteS3ObjectProvider.node.addDependency(k3sBucket)
  
      k3sBucket.grantDelete(onEvent);
      k3sBucket.grantReadWrite(onEvent);
    }

    // control plane node Security Group      
    const k3scontrolplanesg = new ec2.SecurityGroup(this, 'k3s-controlplane-SG', {
      vpc,
      securityGroupName: 'k3s-controlplane-SG',
      allowAllOutbound: true,
    });
    k3scontrolplanesg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH');
    k3scontrolplanesg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(6443), 'K3s port');

    // worker nodes Security Group      
    const k3sworkersg = new ec2.SecurityGroup(this, 'k3s-worker-SG', {
      vpc,
      securityGroupName: 'k3-worker-SG',
      allowAllOutbound: true,
    });
    // for this prototype the workers are being placed in a public subnet 
    // ideally they should land on a private subnet 
    /// also ingress traffic - ssh (bastion style) or 6443 - should come from the control plane node only 
    k3sworkersg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH')
    k3sworkersg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(6443), 'K3s port');

    // check if the user requires a particular instance type for workers and control plane
    // if not, the default instance type is used 
    this.controlPlaneInstanceType = props.controlPlaneInstanceType ?? DEFAULT_INSTANCE_TYPE;
    this.workerInstanceType = props.workerInstanceType ?? DEFAULT_INSTANCE_TYPE;

    // create control plane node
    const k3scontrolplane = new ec2.Instance(this, 'k3s-controlplane', {
      instanceType: this.controlPlaneInstanceType,
      machineImage: new AmiProvider().amiId,
      vpc,
      vpcSubnets: {
        subnets: vpc.publicSubnets,
      },
      instanceName: 'k3s-controlplane',
      securityGroup: k3scontrolplanesg,
    });
    
    k3scontrolplane.addUserData(`
       #!/bin/bash
       curl -L -o k3s https://github.com/rancher/k3s/releases/download/v1.16.9%2Bk3s1/k3s-arm64
       chmod +x k3s
       ./k3s server &
       sleep 30
       ENDPOINT=$(curl http://169.254.169.254/latest/meta-data/public-hostname) 
       cp /etc/rancher/k3s/k3s.yaml /etc/rancher/k3s/kubeconfig.yaml
       sed -i s/127.0.0.1/$ENDPOINT/ /etc/rancher/k3s/kubeconfig.yaml
       aws s3 cp /var/lib/rancher/k3s/server/node-token s3://${k3sBucket.bucketName}/node-token
       aws s3 cp /etc/rancher/k3s/kubeconfig.yaml s3://${k3sBucket.bucketName}/kubeconfig.yaml
     `);

    
    this.endpointUri = k3scontrolplane.instancePublicIp 
    
    // create worker ASG
    const workerAsg = new autoscaling.AutoScalingGroup(this, 'WorkerAsg', { 
      instanceType: this.workerInstanceType,
      machineImage: new AmiProvider().amiId,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, 
      },
      minCapacity: props.workerMinCapacity ?? 3,
      spotPrice: props.spotWorkerNodes ? PriceMap.get(this.workerInstanceType.toString()) : undefined,
    })

    workerAsg.addUserData(`
       #!/bin/bash
       LOGFILE='/var/log/k3s.log'
       curl -L -o k3s https://github.com/rancher/k3s/releases/download/v1.16.13%2Bk3s1/k3s-arm64
       chmod +x k3s
       echo the bucket name is ${k3sBucket.bucketName} 
       aws s3 cp s3://${k3sBucket.bucketName}/node-token /node-token 
       (./k3s agent --server https://${k3scontrolplane.instancePrivateIp}:6443 \
       --token $(cat /node-token) 2>&1 | tee -a $LOGFILE || echo "failed" > $LOGFILE &)
    `);

    workerAsg.addSecurityGroup(k3sworkersg)
    
    // enable the SSM session manager
    workerAsg.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))

    // grant the S3 write permission to the control plane node and read permissions to the worker nodes
    k3sBucket.grantWrite(k3scontrolplane.role)
    k3sBucket.grantRead(workerAsg.role)

    // endpoint info
    new cdk.CfnOutput(this, 'Endpoint', { value: `https://${k3scontrolplane.instancePublicIp}:6443`})

    // kubeconfig.yaml path
    new cdk.CfnOutput(this, 'Kubernetes configuration file', { value: `s3://${k3sBucket.bucketName}/kubeconfig.yaml` });

    workerAsg.node.addDependency(k3scontrolplane)
  }  
}

/**
 * The AMI provider to get the latest Amazon Linux 2 AMI for ARM64
 */
export class AmiProvider {
  public get amiId() {
    return ec2.MachineImage.latestAmazonLinux({
      cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    })
  }
}

/**
 * The VPC provider to create or import the VPC
 */
export class VpcProvider {
  public static getOrCreate(scope: cdk.Construct) {
    const vpc = scope.node.tryGetContext('use_default_vpc') === '1' ?
      ec2.Vpc.fromLookup(scope, 'Vpc', { isDefault: true }) :
      scope.node.tryGetContext('use_vpc_id') ?
        ec2.Vpc.fromLookup(scope, 'Vpc', { vpcId: scope.node.tryGetContext('use_vpc_id') }) :
        new ec2.Vpc(scope, 'Vpc', { maxAzs: 3, natGateways: 1 });
    return vpc    
  }
}