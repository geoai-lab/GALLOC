# GALLOC: a GeoAnnotator for Labeling LOCation descriptions from disaster-related text messages

## Overview
GALLOC is a GeoAnnotator for Labeling LOCation descriptions from disaster-related text messages. It is a Web-based and open-source platform that supports the creation of a dataset with labeled location descriptions, their categories, and spatial footprints. 
GALLOC consists of three major modules: 1) user module, 2) project module, and 3) annotation module. The overall architecture of GALLOC is shown in the following figure.
<p align="center">
<img align="center" src="fig/overall_architecture.png" width="600" />
</p>

* The User Module supports the sign-up, login, and password changes of the users. Three roles are designed for the users: creator, administrator, and annotator. The creator role allows a user to create a project, edit project configurations (e.g., how many annotators are assigned to each text message), and resolve potential annotation disagreements from different users. The administrators are assigned by the creator and they share the same privileges as the creator. The annotator role only allows a user to make annotations. A user can concurrently be a creator, an administrator, and an annotator.
* The Project Module manages the creation, editing, and deleting of projects. A project can be created by specifying its project name, geographic scope, category schema, and number of annotators, batch size of messages, and uploading data to be annotated. A project can be edited and deleted by its creator and administrators. The annotated messages pertaining to a project can be compiled into a corpus which can then be downloaded. 
* The Annotation and Resolution Module supports the annotation of text messages and resolution of disagreements in annotations. An annotation can be made by selecting the location description in a message, specifying its category and spatial footprint.

## Repository resources and structure
This repository contains the source code of GALLOC and its user manual under permitted licenses.
The core code is in the folder "src/main". Specifically:
* The folder "src/main/java" contains the Java source code for implementing servlets and database operations in the server side;
* The folder "src/main/webapp" contains the HTML, Javascript, and css code for creating dynamic user interfaces in the client side.
* The file "User_Manual_GALLOC.pdf" is the user manual of GALLOC.
* The file "Test_corpus.txt" is an example corpus containing 100 social media messages that users can use to test the system.

## Deployment
You will need the following tools to deploy this project on your local machine.
* Java JDK 15
* Apache Tomcat 9.0
* SQLite3 database

Clone this GitHub project to your computer and follow the steps below.
#### Configure the Web geocoding services based on Nominatim and Google Maps
The Web services of Nominatim and Google Maps are used in GALLOC for automatically identifying spatial footprints of location descriptions. Therefore, you will need to configure the URL for your Nominatim Web services and key for Google Maps API. You can find the configuration file "config.json" in the folder "src/main/webapp". In this file, there is a JSON object. You will need to add values for attributes of "url" and "apiKey". Otherwise, the function for automatically identifying spatial footprints of location descriptions will not be able to be used though you still can run GALLOC. For Nominatim, you can use the official URL (https://nominatim.openstreetmap.org/), or you can also consider deploying Nominatim on your own server and use your own URL.

#### Import GALLOC into an IDE 
GALLOC is implemented as a Java Web application using Eclipse IDE. You can import GALLOC into Eclipse, but you can also use other IDEs.

#### Test on a Tomcat server
Three ways you may use to deploy GALLOC on a Tomcat server.
* Deploy GALLOC on a Tomcat server within your IDE. Taking Eclipse (4.19.0) as an example, you first can right click the whole project and select "Run As" and "Run on Server". Then, you can finish the deployment of this project by selecting the Tomcat server.  
* Deploy GALLOC on a stand-alone Tomcat server on Windows. First, you need to export the GALLOC project into a .war file using your IDE. Taking Eclipse (4.19.0) as an example, you can right click the whole project and then select "Export" and "WAR file" to export it into a .war file. Second, you will need to put the .war file into the "webapps" folder in Tomcat server. Third, you will need to start the Tomcat server bu running "catalina.bat start" in Command Prompt.      
* Deploy GALLOC on a stand-alone Tomcat server on Linux. You may still want to export the GALLOC project into a .war file using the same apporach mentioned above. Then you will need to put the .war file into "/var/lib/tomcat8/webapps/". Finally, restart the Tomcat server with the command: "sudo systemctl restart tomcat8".

The first two approaches are to deploy GALLOC on your local copmuter. You can open http://localhost:8080/GALLOC/index.html on the browser to see deployed GALLOC. The third approach is to deploy GALLOC on a Linux server. You can open the *URL of your Linux Server* + "GALLOC/index.html" on the browser to see GALLOC deployed on your server. If the page is successfully shown on the broswer, congratulations, you have finished deploying GALLOC.

*Please feel free to reach us if you run into any issues in your deployment.*

## Online demo
You can also use our [online demo](https://geoai.geog.buffalo.edu/GALLOC/) based on the user manual.

## Authors
* **Kai Sun** - *GeoAI Lab* - Email: ksun4@buffalo.edu
* **Yingjie Hu** - *GeoAI Lab* - Email: yhu42@buffalo.edu

## License

This project is licensed under the GNU GENERAL PUBLIC LICENSE 3.0 - see the [LICENSE](LICENSE) file for details.