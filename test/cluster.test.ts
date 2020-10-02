import * as ec2 from '@aws-cdk/aws-ec2';
import { App, Stack, RemovalPolicy } from '@aws-cdk/core';
import * as k3s from '../src';
import '@aws-cdk/assert/jest';

test('create the default cluster', () => {

  // GIVEN
  const app = new App();
  const stack = new Stack(app, 'testing-stack');

  // WHEN
  new k3s.Cluster(stack, 'Cluster');

  // THEN

  expect(stack).toHaveResource('AWS::AutoScaling::AutoScalingGroup', {
    MaxSize: '3',
    MinSize: '3',
    LaunchTemplate: {
      LaunchTemplateId: {
        Ref: 'ClusterWorkerLaunchTemplate84D2244A',
      },
      Version: {
        'Fn::GetAtt': [
          'ClusterWorkerLaunchTemplate84D2244A',
          'LatestVersionNumber',
        ],
      },
    },
  });

  expect(stack).toHaveResource('AWS::AutoScaling::LaunchConfiguration');
});

test('add s3 removalPolicy', () => {
  const app = new App();
  const stack = new Stack(app, 'testing-stack');
  new k3s.Cluster(stack, 'Cluster-s3-removalPolicy', {
    bucketRemovalPolicy: RemovalPolicy.DESTROY,
  });
  expect(stack).toHaveResource('AWS::S3::Bucket');
  expect(stack).toHaveResource('AWS::CloudFormation::CustomResource', {
    Bucket: {
      Ref: 'Clusters3removalPolicyk3sBucket7F058C67',
    },
  });
});

test('support m6g instance types', () => {
  // GIVEN
  const app = new App();
  const stack = new Stack(app, 'testing-stack');
  // WHEN
  new k3s.Cluster(stack, 'Cluster-test', {
    bucketRemovalPolicy: RemovalPolicy.DESTROY,
    controlPlaneInstanceType: new ec2.InstanceType('m6g.large'),
    workerInstanceType: new ec2.InstanceType('m6g.medium'),
    spotWorkerNodes: true,
  });
  // THEN
  // worker nodes ASG
  expect(stack).toHaveResourceLike('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      ImageId: {
        Ref: 'SsmParameterValueawsserviceamiamazonlinuxlatestamzn2amihvmarm64gp2C96584B6F00A464EAD1953AFF4B05118Parameter',
      },
      InstanceMarketOptions: {
        MarketType: 'spot',
        SpotOptions: {
          SpotInstanceType: 'one-time',
        },
      },
      InstanceType: 'm6g.medium',
    },
  });
  // control plane ec2
  expect(stack).toHaveResource('AWS::EC2::Instance', {
    InstanceType: 'm6g.large',
  });
});

test('support t4g instance types', () => {
  // GIVEN
  const app = new App();
  const stack = new Stack(app, 'testing-stack');
  // WHEN
  new k3s.Cluster(stack, 'Cluster-test', {
    bucketRemovalPolicy: RemovalPolicy.DESTROY,
    controlPlaneInstanceType: new ec2.InstanceType('t4g.large'),
    workerInstanceType: new ec2.InstanceType('t4g.medium'),
    spotWorkerNodes: true,
  });
  // THEN
  // worker nodes ASG
  expect(stack).toHaveResourceLike('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      ImageId: {
        Ref: 'SsmParameterValueawsserviceamiamazonlinuxlatestamzn2amihvmarm64gp2C96584B6F00A464EAD1953AFF4B05118Parameter',
      },
      InstanceMarketOptions: {
        MarketType: 'spot',
        SpotOptions: {
          SpotInstanceType: 'one-time',
        },
      },
      InstanceType: 't4g.medium',
    },
  });
  // control plane ec2
  expect(stack).toHaveResource('AWS::EC2::Instance', {
    InstanceType: 't4g.large',
  });
});
