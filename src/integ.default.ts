import * as k3s from './'
import { App, Stack, CfnOutput } from '@aws-cdk/core';
// import * as ec2 from '@aws-cdk/aws-ec2';


export class IntegTesting {
  readonly stack: Stack[];

  constructor() {
    const app = new App();
    const env = {
      region: process.env.CDK_DEFAULT_REGION,
      account: process.env.CDK_DEFAULT_ACCOUNT,
    };
    
    const stack = new Stack(app, 'testing-stack', { env });
    
    // const vpc = k3s.VpcProvider.getOrCreate(stack);
    
    const cluster = new k3s.Cluster(stack, 'Cluster')

    //    const cluster = new k3s.Cluster(stack, 'Cluster', {
    //      vpc,
    //      spotWorkerNodes: true,
    //      workerMinCapacity: 3,
    //      workerInstanceType: new ec2.InstanceType('m6g.medium'),
    //      controlPlaneInstanceType: new ec2.InstanceType('m6g.medium'),
    //    })
    
    new CfnOutput(stack, 'EndpointURI', { value: cluster.endpointUri }); 
    this.stack = [ stack ]
  };
}

// run the integ testing
new IntegTesting();
