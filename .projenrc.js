const {
  AwsCdkConstructLibrary,
  DependenciesUpgradeMechanism,
} = require('projen');

const AWS_CDK_LATEST_RELEASE = '1.62.0';
const PROJECT_NAME = 'cdk-k3s-cluster';
const PROJECT_DESCRIPTION = 'A JSII construct lib to deploy a K3s cluster on AWS with CDK';
const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new AwsCdkConstructLibrary({
  authorName: 'Massimo Re Ferre',
  authorEmail: 'mreferre@amazon.com',
  name: PROJECT_NAME,
  repository: 'https://github.com/aws-samples/aws-cdk-for-k3scluster',
  description: PROJECT_DESCRIPTION,
  license: 'MIT',
  copyrightOwner: 'AWS Samples',
  copyrightPeriod: '2020',
  keywords: [
    'aws',
    'kubernetes',
    'k3s',
    'graviton',
    'spot',
  ],
  autoApproveOptions: {
    secret: 'PROJEN_GITHUB_TOKEN',
  },
  depsUpgrade: DependenciesUpgradeMechanism.githubWorkflow({
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      secret: AUTOMATION_TOKEN,
    },
  }),
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['mreferre', 'pahud'],
  },
  defaultReleaseBranch: 'master',
  catalog: {
    twitter: 'mreferre',
    announce: false,
  },
  cdkVersion: AWS_CDK_LATEST_RELEASE,
  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-s3',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-autoscaling',
    '@aws-cdk/custom-resources',
    '@aws-cdk/aws-logs',
    '@aws-cdk/aws-lambda',
  ],
  minNodeVersion: '14.17.0',
  python: {
    distName: 'cdk-k3s-cluster',
    module: 'cdk_k3s_cluster',
  },
});

project.package.addField('resolutions', {
  'set-value': '^4.0.1',
});


const common_exclude = ['cdk.out', 'cdk.context.json', 'images', 'yarn-error.log'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();
