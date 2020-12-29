const {
  AwsCdkConstructLibrary,
} = require('projen');

const AWS_CDK_LATEST_RELEASE = '1.62.0';
const PROJECT_NAME = 'cdk-k3s-cluster';
const PROJECT_DESCRIPTION = 'A JSII construct lib to deploy a K3s cluster on AWS with CDK';

const project = new AwsCdkConstructLibrary({
  authorName: 'Massimo Re Ferre',
  authorEmail: 'mreferre@amazon.com',
  name: 'cdk-k3s-cluster',
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
  dependabot: false,
  releaseBranches: ['master'],
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

  python: {
    distName: 'cdk-k3s-cluster',
    module: 'cdk_k3s_cluster',
  },
});


// create a custom projen and yarn upgrade workflow
const workflow = project.github.addWorkflow('ProjenYarnUpgrade');

workflow.on({
  schedule: [{
    cron: '0 6 * * 0',
  }], // 6AM every Sunday
  workflow_dispatch: {}, // allow manual triggering
});

workflow.addJobs({
  upgrade: {
    'runs-on': 'ubuntu-latest',
    'steps': [
      { uses: 'actions/checkout@v2' },
      {
        uses: 'actions/setup-node@v1',
        with: {
          'node-version': '10.17.0',
        },
      },
      { run: 'yarn upgrade' },
      { run: 'yarn projen:upgrade' },
      // submit a PR
      {
        name: 'Create Pull Request',
        uses: 'peter-evans/create-pull-request@v3',
        with: {
          'token': '${{ secrets.PROJEN_GITHUB_TOKEN }}',
          'commit-message': 'chore: upgrade projen',
          'branch': 'auto/projen-upgrade',
          'title': 'chore: upgrade projen and yarn',
          'body': 'This PR upgrades projen and yarn upgrade to the latest version',
          'labels': 'auto-merge',
        },
      },
    ],
  },
});

const common_exclude = ['cdk.out', 'cdk.context.json', 'images', 'yarn-error.log'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();
