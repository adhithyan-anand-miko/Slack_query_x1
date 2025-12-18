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
    booleanParam(
      name: 'INJECT_ENV_FILE',
      defaultValue: true,
      description: 'Inject .env file from Jenkins credentials'
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

    // 🔒 CONSTANTS — change only if you really mean it
    CONTAINER_NAME = 'email-verify-engine'
    HOST_PORT = '5000'
    CONTAINER_PORT = '5000'
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

    stage('Deploy Container') {
      steps {
        sh '''
          echo "Deploying container: ${CONTAINER_NAME}"
          echo "Stopping existing container (if any)..."

          docker stop ${CONTAINER_NAME} || true
          docker rm ${CONTAINER_NAME} || true

          echo "Starting new container on port ${HOST_PORT}"

          docker run -d \
            --name ${CONTAINER_NAME} \
            --restart unless-stopped \
            --env-file ${ENV_TARGET_FILE} \
            -p ${HOST_PORT}:${CONTAINER_PORT} \
            ${IMAGE_REF}

          echo "Container ${CONTAINER_NAME} is running"
        '''
      }
    }
  }

  post {
    success {
      echo "✅ Deployment successful — App live on port ${HOST_PORT}"
    }
    failure {
      echo "❌ Deployment failed — check logs above"
    }
    always {
      cleanWs(cleanWhenNotBuilt: false)
    }
  }
}