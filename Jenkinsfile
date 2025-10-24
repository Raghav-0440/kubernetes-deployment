pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'rg1997/demo-app'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig'
        ACTIVE_VERSION = 'UNKNOWN'
    }
    
    stages {
        stage('Determine Active Version') {
            steps {
                withKubeConfig([credentialsId: KUBECONFIG_CREDENTIALS_ID]) {
                    script {
                        try {
                            ACTIVE_VERSION = sh(script: 'kubectl get svc demo-app-svc -o jsonpath="{.spec.selector.version}"', returnStdout: true).trim()
                            DEPLOY_VERSION = ACTIVE_VERSION == 'blue' ? 'green' : 'blue'
                        } catch (Exception e) {
                            DEPLOY_VERSION = 'blue'  // Default to blue for first deployment
                        }
                        echo "Current active version is ${ACTIVE_VERSION}, deploying to ${DEPLOY_VERSION}"
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                dir('app') {
                    script {
                        docker.build("${DOCKER_IMAGE}:${DEPLOY_VERSION}")
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', DOCKER_CREDENTIALS_ID) {
                        docker.image("${DOCKER_IMAGE}:${DEPLOY_VERSION}").push()
                    }
                }
            }
        }
        
        stage('Deploy New Version') {
            steps {
                withKubeConfig([credentialsId: KUBECONFIG_CREDENTIALS_ID]) {
                    script {
                        sh "kubectl apply -f k8s/${DEPLOY_VERSION}-deployment.yaml"
                        sh "kubectl rollout status deployment/demo-app-${DEPLOY_VERSION}"
                    }
                }
            }
        }
        
        stage('Switch Traffic') {
            steps {
                withKubeConfig([credentialsId: KUBECONFIG_CREDENTIALS_ID]) {
                    script {
                        sh """
                            kubectl patch svc demo-app-svc -p '{"spec":{"selector":{"version":"${DEPLOY_VERSION}"}}}'
                        """
                        echo "Traffic switched to ${DEPLOY_VERSION} version"
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    echo "Verifying deployment..."
                    sleep 30  // Wait for 30 seconds to ensure everything is working
                }
            }
        }
        
        stage('Cleanup Old Version') {
            steps {
                withKubeConfig([credentialsId: KUBECONFIG_CREDENTIALS_ID]) {
                    script {
                        if (ACTIVE_VERSION != 'UNKNOWN') {
                            sh "kubectl scale deployment demo-app-${ACTIVE_VERSION} --replicas=0"
                            echo "Scaled down ${ACTIVE_VERSION} deployment"
                        }
                    }
                }
            }
        }
    }
    
    post {
        failure {
            script {
                echo "Deployment failed, you may need to rollback"
                // Add rollback logic here if needed
            }
        }
    }
}