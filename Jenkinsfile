pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  parameters {
    string(
      name: 'IMAGE_REPOSITORY',
      defaultValue: 'your-docker-user/email-verify-engine',
      description: 'Docker image name (e.g. org/app)'
    )
    string(
      name: 'IMAGE_TAG',
      defaultValue: '',
      description: 'Optional image tag. Defaults to Jenkins build number.'
    )
    string(
      name: 'REGISTRY_URL',
      defaultValue: 'docker.io',
      description: 'Docker registry (docker.io, ghcr.io, etc.)'
    )
    booleanParam(
      name: 'PUSH_IMAGE',
      defaultValue: false,
      description: 'Push the image after a successful build'
    )
    string(
      name: 'DOCKER_CREDENTIALS_ID',
      defaultValue: 'docker-registry',
      description: 'Jenkins credentials ID for Docker registry'
    )
    booleanParam(
      name: 'INJECT_ENV_FILE',
      defaultValue: true,
      description: 'Inject a managed .env file into the workspace'
    )
    string(
      name: 'ENV_FILE_CREDENTIALS_ID',
      defaultValue: 'slack_env',
      description: 'Jenkins file credential ID containing .env'
    )
    string(
      name: 'ENV_TARGET_FILE',
      defaultValue: '.env',
      description: 'Target filename for injected env file'
    )
  }

  environment {
    DOCKER_BUILDKIT = '1'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Inject .env') {
      when {
        expression {
          params.INJECT_ENV_FILE && params.ENV_FILE_CREDENTIALS_ID?.trim()
        }
      }
      steps {
        withCredentials([
          file(
            credentialsId: params.ENV_FILE_CREDENTIALS_ID,
            variable: 'ENV_FILE'
          )
        ]) {
          sh 'cp "$ENV_FILE" "$ENV_TARGET_FILE"'
        }
      }
    }

    stage('Docker Build') {
      steps {
        script {
          env.EFFECTIVE_IMAGE_TAG = params.IMAGE_TAG?.trim()
            ? params.IMAGE_TAG.trim()
            : env.BUILD_NUMBER

          env.IMAGE_REF = "${params.IMAGE_REPOSITORY}:${env.EFFECTIVE_IMAGE_TAG}"
        }

        sh '''
          echo "Building image: ${IMAGE_REF}"
          docker build -t ${IMAGE_REF} .
        '''
      }
    }

    stage('Docker Push') {
      when {
        expression { params.PUSH_IMAGE }
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
            echo "$REGISTRY_PASS" | docker login ${REGISTRY_URL} \
              --username "$REGISTRY_USER" \
              --password-stdin

            docker tag ${IMAGE_REF} ${REGISTRY_URL}/${IMAGE_REF}
            docker push ${REGISTRY_URL}/${IMAGE_REF}
          '''
        }
      }
    }
  }

  post {
    success {
      echo "Build successful 🟢 Image: ${params.REGISTRY_URL}/${env.IMAGE_REF}"
    }
    failure {
      echo "Build failed 🔴 Check the logs above."
    }
    always {
      cleanWs(cleanWhenNotBuilt: false)
    }
  }
}