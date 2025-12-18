pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  parameters {
    string(name: 'IMAGE_REPOSITORY', defaultValue: 'your-docker-user/email-verify-engine', description: 'Docker repository name (e.g. org/app).')
    string(name: 'IMAGE_TAG', defaultValue: '', description: 'Optional tag override. Defaults to the Jenkins build number.')
    string(name: 'REGISTRY_URL', defaultValue: 'docker.io', description: 'Docker registry host (e.g. docker.io, ghcr.io).')
    booleanParam(name: 'PUSH_IMAGE', defaultValue: false, description: 'Push the image to the registry after a successful build.')
    string(name: 'DOCKER_CREDENTIALS_ID', defaultValue: 'docker-registry', description: 'Jenkins credentials ID containing the registry username/password.')
    booleanParam(name: 'INJECT_ENV_FILE', defaultValue: true, description: 'Copy a managed .env file into the workspace before building.')
    string(name: 'ENV_FILE_CREDENTIALS_ID', defaultValue: 'slack_env', description: 'Jenkins file credential ID (e.g. slack_env) that stores the .env payload.')
    string(name: 'ENV_TARGET_FILE', defaultValue: '.env', description: 'Destination filename for the injected environment file.')
  }

  environment {
    NODE_ENV = 'production'
    DOCKER_BUILDKIT = '1'
    COMPOSE_PROJECT_NAME = 'emailverifyengine'
  }

  stages {
    stage('Checkout Code') {
      steps {
        checkout scm
      }
    }

    stage('Inject .env') {
      when {
        expression { return params.INJECT_ENV_FILE && params.ENV_FILE_CREDENTIALS_ID?.trim() }
      }
      steps {
        withCredentials([
          file(credentialsId: params.ENV_FILE_CREDENTIALS_ID, variable: 'ENV_FILE')
        ]) {
          sh 'cp "$ENV_FILE" "$ENV_TARGET_FILE"'
        }
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'node -v'
        sh 'npm -v'
        sh 'npm ci'
      }
    }

    stage('Static checks') {
      steps {
        sh 'npm run check'
      }
    }

    stage('Build artifacts') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Docker build') {
      steps {
        script {
          env.EFFECTIVE_IMAGE_TAG = params.IMAGE_TAG?.trim() ? params.IMAGE_TAG.trim() : env.BUILD_NUMBER
          env.IMAGE_REF = "${params.IMAGE_REPOSITORY}:${env.EFFECTIVE_IMAGE_TAG}"
          env.FULL_IMAGE_REF = "${params.REGISTRY_URL}/${env.IMAGE_REF}".replaceAll('docker.io/', '')
        }
        sh 'docker build -t ${IMAGE_REF} .'
      }
    }

    stage('Docker push') {
      when {
        expression { return params.PUSH_IMAGE }
      }
      steps {
        withCredentials([
          usernamePassword(
            credentialsId: params.DOCKER_CREDENTIALS_ID,
            usernameVariable: 'REGISTRY_USER',
            passwordVariable: 'REGISTRY_PASS'
          )
        ]) {
          sh '''
            echo "$REGISTRY_PASS" | docker login ${REGISTRY_URL} --username "$REGISTRY_USER" --password-stdin
            docker tag ${IMAGE_REF} ${REGISTRY_URL}/${IMAGE_REF}
            docker push ${REGISTRY_URL}/${IMAGE_REF}
          '''
        }
      }
    }
  }

  post {
    success {
      echo "Deployment complete! Proud of you buddy!! Image: ${params.REGISTRY_URL}/${env.IMAGE_REF}"
    }
    failure {
      echo "Build or deploy failed. I'm so sorry buddy!!"
    }
    always {
      cleanWs(cleanWhenNotBuilt: false)
    }
  }
}
