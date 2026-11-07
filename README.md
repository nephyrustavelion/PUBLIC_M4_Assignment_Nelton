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