# PUBLIC_M4_Assignment_Nelton

Some Vocab takeaway
# -DskipTests means Skips executing tests, but normally still compiles test code

#JAR stands for Java ARchieve
# For Spring Boot, an executable JAR typically includes your application code, dependencies, configuration and the necessary Spring Boot launcher.
# So can execute it using: java -jar simplecrmlite-0.0.1-SNAPSHOT.jar



# For Github workflows

# ==========================================
# UNDERSTANDING THE NEW CODE
# ==========================================
# Code	Purpose
# $GITHUB_REF_TYPE	Identifies whether the workflow was triggered by a branch or tag
# $GITHUB_REF_NAME	Retrieves the branch or Git tag name
# ${GITHUB_REF_NAME#v}	Removes the leading v from a version such as v0.1.0
# ${GITHUB_SHA::7}	Retrieves the first seven characters of the commit SHA
# docker build -t	Builds an image and assigns its tag
# docker push	Publishes that tagged image to Docker Hub
# ==========================================

<!-- Create Git tags
git switch main
git pull --ff-only

git tag -a v0.1.0 -m "Initial TaskFlow release"
git push origin v0.1.0 -->



Render final url
https://m4-assignment-nelton-taskflow.onrender.com/api/tasks

Docker Hub image
https://hub.docker.com/repository/docker/nephyrustavelion/taskflow/tags


Git hub Actions
https://github.com/nephyrustavelion/PUBLIC_M4_Assignment_Nelton/actions


Option 1 added github actions

Option 2 to do

Option 3 not doing
Using Postman, using the render url of these, it should work, refer to screenshot 

POST task 1
POST task 2
GET tasks
DELETE task 1
DELETE task 2

Option 4 did, explain how the ci.yml works


Option 5 can use chatgpt to try to do
Snyk token saved in .env

Added compose.yaml, to run Snyk scan:
SCA - Scan Maven Dependencies
docker compose --profile security run --rm --no-deps snyk


SAST — Scan Java source code
docker compose --profile security run --rm --no-deps snyk snyk test --severity-threshold=high --maven-skip-wrapper

C. Container scan — Scan your Docker image
First build your application:
docker compose build app
Export the resulting image:
docker save taskflow:local -o taskflow-image.tar
Then scan that archive using the same Snyk container:
docker compose --profile security run --rm --no-deps snyk snyk container test docker-archive:taskflow-image.tar --file=Dockerfile --severity-threshold=high



Added dependabot.yml file

Added zap-baseline.yml for OWASP

--

Other optimisation code lines did for dockerfile and ci.yml

From lesson 4.16, added this line in dockerfile 
RUN mvn -B dependency:go-offline
So that depedencies are cache locally and reduce the time took to build. 
--

The important lines are:

cache-from
cache-from: type=gha,scope=taskflow

Retrieves cached Docker build layers from GitHub Actions' cache storage.

cache-to
cache-to: type=gha,scope=taskflow,mode=max
From lesson 4.11 or 4.12, these lines in ci.yml, after github actions ran, instead of:
GitHub Actions (Run 1)
    ↓
Set up Java 21
    ↓
Download Maven dependencies
    ↓
Compile → Test → Package

GitHub Actions (Run 2)
    ↓
Set up Java 21
    ↓
Download Maven dependencies AGAIN
    ↓
Compile → Test → Package

it is:
GitHub Actions (Run 1)
    ↓
Set up Java 21
    ↓
Cache MISS
    ↓
Download Maven dependencies
    ↓
Compile → Test → Package
    ↓
Save Maven dependency cache

GitHub Actions (Run 2)
    ↓
Set up Java 21
    ↓
Cache HIT
    ↓
Restore downloaded dependencies
    ↓
Compile → Test → Package

Note the portion before compile test package. 

--