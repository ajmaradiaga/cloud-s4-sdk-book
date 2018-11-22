# SAP Leonardo Machine Learning und the SAP S/4HANA Cloud SDK
Here, we provide the instructions to proceed with the code jam "SAP Leonardo Machine Learning and the SAP S/4HANA Cloud SDK". Below, you find the following information:
* [Technical prerequisites](#prerequisites): software required to execute the steps described in this documentation. This information was provided before the workshop, so, we assume that those prerequisites are already fulfilled. Nevertheless, you can use this description to double check.
* [Task 0: Preparation steps](#task0)
* [Task 1: Retrieve SAP S/4HANA data using the SAP S/4HANA Cloud SDK virtual data model](#task1)
* [Task 2: Integrate SAP Leonardo Machine Learning service to provide translations](#task2)
* [Bonus, Task 3: Write data back to SAP S/4HANA using the SAP S/4HANA Cloud SDK virtual data model](#task3)
* [Bonus, Task 4: Integrate advanced ML capabilities](#task4)

So, let us get started!

## <a name="prerequisites">Technical prerequisites</a>
Please, find the local setup and how to install the required software in the blog post [Step 1 with SAP S/4HANA Cloud SDK: Set up](https://blogs.sap.com/2017/05/15/step-1-with-sap-s4hana-cloud-sdk-set-up/).
Make sure to install all the mentioned tool, including the IDE. All the exercises in the code jam are based on the local development environment.

We will deploy the application in SAP Cloud Platform, Cloud Foundry. For that purpose, you would require your own trial account. [Here](https://cloudplatform.sap.com/try.html), you can find information on how to get your trial account in SAP Cloud Platform, Cloud Foundry. 

For this workshop, we provide a running SAP S/4HANA Mock server that mocks business partner APIs, so you do not need to set up it by yourself. The server is accessable via URL https://bupa-mock-odata-sagittal-inserter.cfapps.eu10.hana.ondemand.com and does not require authentication.
In case you want to try out this hands on later and the service is not available, follow [this description](https://sap.github.io/cloud-s4-sdk-book/pages/mock-odata.html) to set up your own instance of the mock server.

## <a name="task0">Task 0: Preparation steps</a>
Before, we get started with the actual implementation, we need to perform some preparation steps and familiarize ourselves with the project structure. 
* Download the [archive with the initial project version](https://github.com/SAP/cloud-s4-sdk-book/archive/ml-codejam.zip) from the GitHub
* Load into your IDE as a Maven project
* Investigate your project structure:
  * **application** folder contains the business logic that we will extend in this code jam. It also contains the JS based frontend components in the **webapp** subfolder. We will only focus on backend components, though.
  * **integration-tests** and **unit-tests** folders include integration and unit tests. We have already prepared the integration tests for your application, they do not pass yet, though.
  * Artifacts **cx-server**, **Jenkinsfile**, **pipeline_config.yml** help to set up and customize CI/CD server and the pipeline for your SDK based solutions. We will not cover this topic in this code jam, but we highly encourage you to check out [the related resources after the workshop](https://blogs.sap.com/2017/09/20/continuous-integration-and-delivery/)
  * **pom.xml** is a [maven configuration file](https://maven.apache.org/pom.html)
  * **manifest.yml** is a deployment descriptor to be able to deploy the application in SAP Cloud Platform, Cloud Foundry.

Before we get started with the development, let us build and deploy the current state of the application locally.

### Build and test
While building the application, we will execute integration tests. For the integration tests, you need to provide the URL and credentials of your SAP S/4HANA system.
* Open the file `integration-tests/src/test/resources/systems.yml`. Set the default to `MOCK_SYSTEM`: `default: "MOCK_SYSTEM"`, uncomment the following two lines (remove the `#` found in the original file) and supply the URL to your SAP S/4HANA system or Mock server. In the code jam we will use the provided mock server URL.
```
    - alias: "MOCK_SYSTEM"
      uri: "https://bupa-mock-odata-sagittal-inserter.cfapps.eu10.hana.ondemand.com"
```
* In the same directory, create a `credentials.yml` file used during tests with the following content:
```
---
credentials:
- alias: "MOCK_SYSTEM"
  username: "(username)"
  password: "(password)"
```
* In the root folder of the project, run the following command to build and test the application. The credentials path is only required if the file is not located in the same folder as `systems.yml`.
```
mvn clean install
```

### Deploy locally
After you have successfully built the project, you can deploy it locally as follows. This will start a local server that hosts your application.
* Configure your local environment by setting the following environment variables. Replace the URL and credentials with the appropriate values for your SAP S/4HANA Cloud system in case you are not using the provided mock server.
  * Adapt the below commands for setting environment variables as appropriate for your operating system. The following commands are for the Windows command line.
```
set destinations=[{name: 'ErpQueryEndpoint', url: 'https://bupa-mock-odata-sagittal-inserter.cfapps.eu10.hana.ondemand.com', username: 'USERNAME', password: 'PASSWORD'}]
set ALLOW_MOCKED_AUTH_HEADER=true
```
* Run the following commands to deploy the application on a local server.
```
mvn tomee:run -pl application
```
* Open the URL http://localhost:8080/address-manager in your browser to see the frontend of the launched application.

At this phase, we do not have any data returned from the application and we see the runtime exception in the console, saying that we need to implement the functionality. Let us start with the first step: integrating SAP S/4HANA into this application using the SAP S/4HANA Cloud SDK.

## <a name="task1">Task 1: Retrieve SAP S/4HANA data using the SAP S/4HANA Cloud SDK virtual data model</a>
In this step, we will implement two queries to SAP S/4HANA to retrieve business partner data. Firstly, we will retrieve the list of business partners for the list view in  the application. Secondly, we will retrieve detailed data a single business partner by ID.

Start the development of queries by looking into the class BusinessPartnerServlet, which is a servlet exposing the API. 
We could use any API framework here, such as JAX-RS or Spring. However, we use a servlet here for simplicity. Looking into the servlet, we can see that the main functionality is moved out into the commands GetAllBusinessPartnersCommand and GetSingleBusinessPartnerByIdCommand. Open and implement both commands as explained below.

The GetAllBusinessPartnersCommand should return a list of available business partners in the ERP system. The class was already created. We just have to implement the execute method:
* The instance of the class BusinessPartnerService already provides a method to retrieve all business partners. Type service to see a list of all available methods. Use the method getAllBusinessPartner to fetch multiple business partner entities.
* We only want to return the properties first name, last name and id. Thus, select only these properties by using the select method on the result from step 1. Luckily, we do not have to know the exact names of these properties in the public API of S/4HANA. They are codified as static member of the class BusinessPartner. We can select the business partner id by using BusinessPartner.BUSINESS_PARTNER. Please, do the same for the first name and last name.
* There are multiple categories of business partners. In this session, we only want to retrieve persons. The category is identified by a number, which is stored in the static class variable called CATEGORY_PERSON. The method to filter is called filter and can be executed on the result from the previous step.
The property BusinessPartner.BUSINESS_PARTNER_CATEGORY should equal CATEGORY_PERSON. To express that use the methods provided by the object BusinessPartner.BUSINESS_PARTNER_CATEGORY.
* We want to order the result by the last name, sorting ascending. The method is called orderBy and expects the property and the order.
* All the previous steps did not execute any requests, but just defined the request. With the method execute you finally execute the query and retrieve the result.
Hint: Try to solve it on your own. However, the solution can also be found in the solution folder in the session material.

The command GetSingleBusinessPartnerByIdCommand should return a specific business partner including address details. The implementation is very similar to the first command.
* In addition to getting all business partners there is a method to get only one business partner identified by the key: getBusinessPartnerByKey. Use this method with the available id property.
* Furthermore, select the properties business partner id, last name, first name, is male, is female and creation date. Also select the corresponding address. It can be accessed using the property TO_BUSINESS_PARTNER_ADDRESS. For the address, select the properties business partner id, address id, country, postal code, city name, street name and house number.
* There is no need to apply additional operations.

To check whether the queries are implemented correctly, go to the integration-tests folder and remove the @Ignore annotation for the following tests: BusinessPartnerServletTest.testGetAll() and BusinessPartnerServletTest.testGetSingle().
Now, build and test the application and make sure that the tests ran successfully. 
```
mvn clean install
```

If the uncommented test do not show errors, congratulations! You have successfully integrated SAP S/4HANA with your application. In the next step, we will see how to integrate one of the SAP Leonardo Machine Learning services in few lines of code.

## <a name="task2">Task 2: Integrate SAP Leonardo Machine Learning service to provide translations</a>

## <a name="task3">Bonus, Task 3: Write data back to SAP S/4HANA using the SAP S/4HANA Cloud SDK virtual data model</a>

## <a name="task4">Bonus, Task 4: Integrate advanced ML capabilities</a>
