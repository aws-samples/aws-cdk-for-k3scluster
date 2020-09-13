# API Reference

**Classes**

Name|Description
----|-----------
[AmiProvider](#cdk-k3s-cluster-amiprovider)|The AMI provider to get the latest Amazon Linux 2 AMI for ARM64.
[Cluster](#cdk-k3s-cluster-cluster)|Represents the k3sCluster construct.
[VpcProvider](#cdk-k3s-cluster-vpcprovider)|The VPC provider to create or import the VPC.


**Structs**

Name|Description
----|-----------
[ClusterProps](#cdk-k3s-cluster-clusterprops)|*No description*



## class AmiProvider  <a id="cdk-k3s-cluster-amiprovider"></a>

The AMI provider to get the latest Amazon Linux 2 AMI for ARM64.


### Initializer




```ts
new AmiProvider()
```




### Properties


Name | Type | Description 
-----|------|-------------
**amiId** | <code>[IMachineImage](#aws-cdk-aws-ec2-imachineimage)</code> | <span></span>



## class Cluster  <a id="cdk-k3s-cluster-cluster"></a>

Represents the k3sCluster construct.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Cluster(scope: Construct, id: string, props?: ClusterProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[ClusterProps](#cdk-k3s-cluster-clusterprops)</code>)  *No description*
  * **bucketRemovalPolicy** (<code>[RemovalPolicy](#aws-cdk-core-removalpolicy)</code>)  The bucket removal policy. __*Default*__: cdk.RemovalPolicy.RETAIN
  * **controlPlaneInstanceType** (<code>[InstanceType](#aws-cdk-aws-ec2-instancetype)</code>)  control plane node ec2 instance type. __*Optional*__
  * **spotWorkerNodes** (<code>boolean</code>)  Run worker nodes as EC2 Spot. __*Optional*__
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  VPC. __*Optional*__
  * **workerInstanceType** (<code>[InstanceType](#aws-cdk-aws-ec2-instancetype)</code>)  worker node instance type. __*Optional*__
  * **workerMinCapacity** (<code>number</code>)  minimal number of worker nodes. __*Default*__: 3



### Properties


Name | Type | Description 
-----|------|-------------
**controlPlaneInstanceType** | <code>[InstanceType](#aws-cdk-aws-ec2-instancetype)</code> | The instance type of the control plane.
**endpointUri** | <code>string</code> | The endpoint URL of the control plan.
**workerInstanceType** | <code>[InstanceType](#aws-cdk-aws-ec2-instancetype)</code> | The instance type of the worker node.



## class VpcProvider  <a id="cdk-k3s-cluster-vpcprovider"></a>

The VPC provider to create or import the VPC.


### Initializer




```ts
new VpcProvider()
```



### Methods


#### *static* getOrCreate(scope) <a id="cdk-k3s-cluster-vpcprovider-getorcreate"></a>



```ts
static getOrCreate(scope: Construct): IVpc
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*

__Returns__:
* <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>



## struct ClusterProps  <a id="cdk-k3s-cluster-clusterprops"></a>






Name | Type | Description 
-----|------|-------------
**bucketRemovalPolicy**? | <code>[RemovalPolicy](#aws-cdk-core-removalpolicy)</code> | The bucket removal policy.<br/>__*Default*__: cdk.RemovalPolicy.RETAIN
**controlPlaneInstanceType**? | <code>[InstanceType](#aws-cdk-aws-ec2-instancetype)</code> | control plane node ec2 instance type.<br/>__*Optional*__
**spotWorkerNodes**? | <code>boolean</code> | Run worker nodes as EC2 Spot.<br/>__*Optional*__
**vpc**? | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | VPC.<br/>__*Optional*__
**workerInstanceType**? | <code>[InstanceType](#aws-cdk-aws-ec2-instancetype)</code> | worker node instance type.<br/>__*Optional*__
**workerMinCapacity**? | <code>number</code> | minimal number of worker nodes.<br/>__*Default*__: 3



