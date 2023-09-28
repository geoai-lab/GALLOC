package edu.buffalo.geoai;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.net.URLEncoder;
import java.net.URL;
import java.net.HttpURLConnection;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import java.net.URLDecoder;

import org.geotools.referencing.GeodeticCalculator;

//import org.locationtech.jts.algorithm.distance.DiscreteHausdorffDistance;
//import org.locationtech.jts.algorithm.distance.DiscreteFrechetDistance;
import org.locationtech.jts.geom.Coordinate;
//import org.locationtech.jts.geom.Polygon;
//import org.locationtech.jts.geom.GeometryFactory;
//import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Envelope;

/**
 * Servlet implementation class AnnotationServlet
 */
@WebServlet("/AnnotationServlet")
public class AnnotationServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	/**
	 * @see HttpServlet#HttpServlet()
	 */
	public AnnotationServlet() {
		super();
		// TODO Auto-generated constructor stub
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		String action = request.getParameter("action");
		JSONObject resultObject = null;

		String pathOfDatabase = getServletContext().getResource(GALLOCConfiguration.database_name).getPath();
		if (action.equals("getBatchMessages")) {
			String projName = request.getParameter("projName");
			String annotator = request.getParameter("annotator");

			resultObject = getBatchMessages(projName, annotator, pathOfDatabase);
		} else if (action.equals("submitAnnotation")) {
			String messageID = request.getParameter("messageID");
			String annotator = request.getParameter("annotator");
			String method = request.getParameter("method");
			String annotationTime = request.getParameter("annotationTime");
			String annotation = request.getParameter("annotation");

			resultObject = submitAnnotation(messageID, annotator, method, annotationTime, annotation, pathOfDatabase);
		} else if (action.equals("submitBatchAnnotation")) {
			String annotationOneBatch = request.getParameter("annotationOneBatch");

			resultObject = submitBatchAnnotation(annotationOneBatch, pathOfDatabase);
		} else if (action.equals("addPreannotator")) {
			String preannotatorName = request.getParameter("preannotatorName");
			String preannotatorURI = request.getParameter("preannotatorURI");
			String projName = request.getParameter("projName");

			resultObject = addPreannotator(projName, preannotatorName, preannotatorURI, pathOfDatabase);
		} else if (action.equals("testPreannotatorValidity")) {
			String preannotatorURI = request.getParameter("preannotatorURI");

			resultObject = getPreannotatorResult(preannotatorURI, "", "test");
		} else if (action.equals("testPreannotatorFormat")) {
			String preannotatorResult = request.getParameter("preannotatorResult");

			resultObject = testPreannotatorFormat(preannotatorResult);
		} else if (action.equals("delPreannotator")) {
			String preannotatorName = request.getParameter("preannotatorName");
			String projName = request.getParameter("projName");

			resultObject = delPreannotator(projName, preannotatorName, pathOfDatabase);
		} else if (action.equals("getPreannotatorList")) {
			String projName = request.getParameter("projName");

			resultObject = getPreannotatorList(projName, pathOfDatabase);
		} else if (action.equals("extractLocationUsingPreannotator")) {
			String projName = request.getParameter("projName");
			String preannotatorName = request.getParameter("preannotatorName");
			String message = request.getParameter("message");

			resultObject = extractLocationUsingPreannotator(projName, preannotatorName, message, pathOfDatabase);
		} else if (action.equals("retriveResolvingAnnotations")) {
			String projName = request.getParameter("projName");

			resultObject = retrieveResolvingAnnotations(projName, pathOfDatabase);
		} else if (action.equals("downloadAnnotationsAll")) {
			String projName = request.getParameter("projName");

			resultObject = downloadAnnotationsAll(projName, pathOfDatabase);
		} else if (action.equals("downloadAnnotationsResolved")) {
			String projName = request.getParameter("projName");

			resultObject = downloadAnnotationsResolved(projName, pathOfDatabase);
		} else if (action.equals("checkStatus")) {
			String projName = request.getParameter("projName");

			resultObject = checkStatus(projName, pathOfDatabase);
		}

		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		if (resultObject != null)
			out.print(resultObject.toString());
		else
			out.print("Servlet Error");
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}

	// retrieve text messages by batch of a project which have not been annotated by
	// the current annotator.
	public JSONObject getBatchMessages(String projName, String annotator, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);
			JSONObject resultObject = new JSONObject();

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no project with this name.");
				return resultObject;
			}
			String projID = rs.getString("ProjectID");
			int batchNumber = rs.getInt("BatchNumber");

			// secondly, test whether this project has data
			rs = stmt.executeQuery("SELECT * FROM Message WHERE ProjectID = '" + projID + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				resultObject.put("status", "noData");
				resultObject.put("error", "There is no data with this project.");
				return resultObject;
			} else {
				// thirdly, test whether there are still some messages which have not been
				// annotated by this annotator.
				rs = stmt.executeQuery("SELECT * FROM Message WHERE ProjectID= '" + projID
						+ "' AND MessageID NOT IN (SELECT MessageID FROM Annotation WHERE AnnotatorName = '" + annotator
						+ "') LIMIT '" + batchNumber + "'");
				if (!rs.next()) {
					rs.close();
					stmt.close();
					c.close();
					resultObject.put("status", "noRemainingMsg");
					resultObject.put("error", "All messages with this project have been annotated.");
					return resultObject;
				} else {
					// if yes, finally retrieve messages by batch.
					rs = stmt.executeQuery("SELECT * FROM Message WHERE ProjectID= '" + projID
							+ "' AND MessageID NOT IN (SELECT MessageID FROM Annotation WHERE AnnotatorName = '"
							+ annotator + "') LIMIT '" + batchNumber + "'");
					JSONArray messageArray = new JSONArray();
					while (rs.next()) {
						String messageId = rs.getString("MessageID");
						String messageData = rs.getString("MessageData");
						JSONObject thisMsgInfo = new JSONObject();
						thisMsgInfo.put("MessageData", messageData);
						thisMsgInfo.put("MessageID", messageId);
						messageArray.put(thisMsgInfo);
					}

					resultObject.put("status", "success");
					resultObject.put("messages", messageArray);

				}
			}

			rs.close();
			stmt.close();
			c.close();
			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	// submit an annotation
	public JSONObject submitAnnotation(String messageID, String annotator, String method, String annotationTime,
			String annotation, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			String decodedAnnotation = URLDecoder.decode(annotation, "UTF-8");
			JSONObject jsonAnnotation = new JSONObject(decodedAnnotation);

			// firstly, test whether this message exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Message WHERE MessageID = '" + messageID + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no message with this ID.");
				return resultObject;
			}

			rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '" + annotator + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "User does not exist.");
				return resultObject;
			}

			String annotationID = Utils.generateRandomStringID();
			stmt.executeUpdate(
					"INSERT INTO Annotation (AnnotationID, MessageID, AnnotatorName, Method, AnnotationTime, Annotation) VALUES('"
							+ annotationID + "', '" + messageID + "','" + annotator + "','" + method + "','"
							+ annotationTime + "','" + jsonAnnotation + "')");

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");

			rs.close();
			stmt.close();
			c.close();

			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	// submit annotations by batch
	public JSONObject submitBatchAnnotation(String annotationOneBatch, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);
			ResultSet rs = null;

			// firstly, decode the submitted batch of annotations.
			String decodedData = URLDecoder.decode(annotationOneBatch, "UTF-8");
			JSONArray jsonArray = new JSONArray(decodedData);
			for (int i = 0; i < jsonArray.length(); i++) {
				JSONObject jsonObject = jsonArray.getJSONObject(i);
				String messageID = jsonObject.getString("messageID");
				String annotator = jsonObject.getString("annotator");
				String method = jsonObject.getString("method");
				String annotationTime = jsonObject.getString("annotationTime");
				JSONObject annotation = jsonObject.getJSONObject("Annotation");

				// firstly, test whether this message exists
				stmt = c.createStatement();
				rs = stmt.executeQuery("SELECT * FROM Message WHERE MessageID = '" + messageID + "'");
				if (!rs.next()) {
					rs.close();
					stmt.close();
					c.close();
					JSONObject resultObject = new JSONObject();
					resultObject.put("status", "failure");
					resultObject.put("error", "There is no message with this ID.");
					return resultObject;
				}

				rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '" + annotator + "'");
				if (!rs.next()) {
					rs.close();
					stmt.close();
					c.close();
					JSONObject resultObject = new JSONObject();
					resultObject.put("status", "failure");
					resultObject.put("error", "User does not exist.");
					return resultObject;
				}

				String annotationID = Utils.generateRandomStringID();
				stmt.executeUpdate(
						"INSERT INTO Annotation (AnnotationID, MessageID, AnnotatorName, Method, AnnotationTime, Annotation) VALUES('"
								+ annotationID + "', '" + messageID + "','" + annotator + "','" + method + "','"
								+ annotationTime + "','" + annotation + "')");
				rs.close();
			}
			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");

			stmt.close();
			c.close();
			return resultObject;
		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	// add a preannotator
	public JSONObject addPreannotator(String projName, String preannotatorName, String preannotatorURI,
			String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no project with this name.");
				return resultObject;
			}
			String projID = rs.getString("ProjectID");
			String preAnnotators = rs.getString("PreAnnotators");
			JSONArray preAnnotatorsArray = new JSONArray(preAnnotators);

			// test whether the preAnnotator name has already exist.
			boolean isExisted = false;
			for (int i = 0; i < preAnnotatorsArray.length(); i++) {
				JSONObject preAnnotator = preAnnotatorsArray.getJSONObject(i);
				if (preannotatorName.equals(preAnnotator.getString("name"))) {
					isExisted = true;
					break;
				}
			}
			if (isExisted) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "This preAnnotator name has already been used.");
				return resultObject;
			}

			// examine whether preAnnotator can be used.
			JSONObject preannotatorValidity = getPreannotatorResult(preannotatorURI, "", "test");
			if (!preannotatorValidity.getBoolean("serviceStatusCode")) {
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "This preAnnotator cannot be accessed.");
				return resultObject;
			}
			String preannotatorResult = preannotatorValidity.getString("success");

			// examine the format of returned results of preAnnotator
			JSONObject preannotatorFormat = testPreannotatorFormat(preannotatorResult);
			if (!preannotatorFormat.getBoolean("isFormatCorrect")) {
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error",
						"This preAnnotator can be accessed, but does not follow the recommended format.");
				return resultObject;
			}

			// update the "preAnnotator" field of the project.
			JSONObject newPreAnnotator = new JSONObject();
			newPreAnnotator.put("name", preannotatorName);
			newPreAnnotator.put("uri", preannotatorURI);
			preAnnotatorsArray.put(newPreAnnotator);
			stmt.executeUpdate("UPDATE Project SET PreAnnotators = '" + preAnnotatorsArray.toString()
					+ "' WHERE ProjectID = '" + projID + "'");

			rs.close();
			stmt.close();
			c.close();

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("success",
					"This pre-annotator has passed the validation for the effectiveness and format, and has been successfully added.");
			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	public JSONObject getPreannotatorResult(String preannotatorURI, String message, String testOrExtract) {
		Boolean serviceStatusCode = false;
		try {
			if (testOrExtract.equals("test")) {
				message = "Buffalo is a beautiful city in New York State.";
			}

			message = URLEncoder.encode(message, "UTF-8");
			preannotatorURI = URLDecoder.decode(preannotatorURI, "UTF-8");
			String url = preannotatorURI + "?text=" + message;
			URL obj = new URL(url);
			HttpURLConnection con = (HttpURLConnection) obj.openConnection();

			con.setRequestMethod("GET");
			con.setConnectTimeout(60000);

			con.setRequestProperty("User-Agent", "Mozilla/5.0");

			int responseCode = -1;
			BufferedReader in = null;
			try {
				responseCode = con.getResponseCode();
				in = new BufferedReader(new InputStreamReader(con.getInputStream()));
			} catch (Exception ee) {
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("serviceStatusCode", serviceStatusCode);
				resultObject.put("error", "Unsuccessful result returned by uploaded parser...");
				return resultObject;
			}

			String inputLine;
			StringBuffer response = new StringBuffer();

			while ((inputLine = in.readLine()) != null) {
				response.append(inputLine);
			}
			in.close();
			con.disconnect();

			if (responseCode == 200) {
				serviceStatusCode = true;
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "success");
				resultObject.put("serviceStatusCode", serviceStatusCode);
				resultObject.put("success", response.toString());
				return resultObject;
			} else {
				serviceStatusCode = false;
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("serviceStatusCode", serviceStatusCode);
				resultObject.put("response code", responseCode);
				resultObject.put("error", response.toString());
				return resultObject;
			}

		} catch (Exception e) {
			e.printStackTrace();
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("serviceStatusCode", serviceStatusCode);
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	public JSONObject testPreannotatorFormat(String preannotatorResult) {
		Boolean isFormatCorrect = false;
		try {

			JSONObject jsonObject = new JSONObject(preannotatorResult);
			JSONObject resultObject = new JSONObject();

			if (jsonObject.has("Annotation")) {
				Object annotationObj = jsonObject.get("Annotation");
				if (annotationObj instanceof JSONArray) {
					JSONArray annotationArray = (JSONArray) annotationObj;

					for (Object obj : annotationArray) {
						if (obj instanceof JSONObject) {
							JSONObject annotation = (JSONObject) obj;

							if (annotation.has("startIdx") && annotation.has("endIdx")
									&& annotation.has("locationDesc")) {
								Object startIdxObj = annotation.get("startIdx");
								Object endIdxObj = annotation.get("endIdx");
								Object locationDescObj = annotation.get("locationDesc");

								if ((startIdxObj instanceof Integer || startIdxObj instanceof Long
										|| startIdxObj instanceof Short)
										&& (endIdxObj instanceof Integer || endIdxObj instanceof Long
												|| endIdxObj instanceof Short)
										&& locationDescObj instanceof String) {
									isFormatCorrect = true;
									resultObject.put("status", "success");
								} else {
									isFormatCorrect = false;
									resultObject.put("status", "failure");
									resultObject.put("error",
											"This pre-annotator does not follow the recommended format.");
								}
							} else {
								isFormatCorrect = false;
								resultObject.put("status", "failure");
								resultObject.put("error", "This pre-annotator does not follow the recommended format.");
							}
						} else {
							isFormatCorrect = false;
							resultObject.put("status", "failure");
							resultObject.put("error", "This pre-annotator does not follow the recommended format.");
						}
					}
				} else {
					isFormatCorrect = false;
					resultObject.put("status", "failure");
					resultObject.put("error", "This pre-annotator does not follow the recommended format.");
				}
			} else {
				isFormatCorrect = false;
				resultObject.put("status", "failure");
				resultObject.put("error", "This pre-annotator does not follow the recommended format.");
			}
			resultObject.put("isFormatCorrect", isFormatCorrect);
			return resultObject;
		} catch (JSONException e) {
			e.printStackTrace();
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("isFormatCorrect", isFormatCorrect);
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	// delete a preannotator
	public JSONObject delPreannotator(String projName, String preannotatorName, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no project with this name.");
				return resultObject;
			}
			String projID = rs.getString("ProjectID");
			String preAnnotators = rs.getString("PreAnnotators");
			JSONArray preAnnotatorsArray = new JSONArray(preAnnotators);

			// if user and project exist, update the "Annotators" field of the project and
			// the "Project" field of the user.
			int index = -1;
			for (int i = 0; i < preAnnotatorsArray.length(); i++) {
				JSONObject preAnnotator = preAnnotatorsArray.getJSONObject(i);
				if (preannotatorName.equals(preAnnotator.getString("name"))) {
					index = i;
					break;
				}
			}

			if (index != -1) {
				preAnnotatorsArray.remove(index);
			} else {
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no such a pre-annotator with this project.");
				return resultObject;
			}

			stmt.executeUpdate("UPDATE Project SET PreAnnotators = '" + preAnnotatorsArray.toString()
					+ "' WHERE ProjectID = '" + projID + "'");

			rs.close();
			stmt.close();
			c.close();

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("success", "This pre-annotator has been successfully deleted.");
			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	// get the existing preannotators list
	public JSONObject getPreannotatorList(String projName, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no project with this name.");
				return resultObject;
			}
			String preAnnotators = rs.getString("PreAnnotators");
			JSONArray preAnnotatorsArray = new JSONArray(preAnnotators);

			rs.close();
			stmt.close();
			c.close();

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("preAnnotators", preAnnotatorsArray);
			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	public JSONObject extractLocationUsingPreannotator(String projName, String preannotatorName, String message,
			String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no project with this name.");
				return resultObject;
			}
			String preAnnotators = rs.getString("PreAnnotators");
			JSONArray preAnnotatorsArray = new JSONArray(preAnnotators);

			rs.close();
			stmt.close();
			c.close();

			// get the URL for the pre-annotator
			String preannotatorURL = null;
			for (int i = 0; i < preAnnotatorsArray.length(); i++) {
				JSONObject preAnnotator = preAnnotatorsArray.getJSONObject(i);
				if (preannotatorName.equals(preAnnotator.getString("name"))) {
					preannotatorURL = preAnnotator.getString("uri");
					break;
				}
			}

			JSONObject preannotatorResult = getPreannotatorResult(preannotatorURL, message, "extract");

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("success", preannotatorResult.getString("success"));
			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	// download corpus of a project.
	public JSONObject downloadAnnotationsAll(String projName, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		JSONObject resultObject = new JSONObject();
		JSONArray allAnnotations = new JSONArray();
		// String absolutePath = null;
		// String webRoot = "path/to/webapp";
		// String filePath = webRoot + "/" + projName + ".json";
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no project with this name.");
				return resultObject;
			}
			String projID = rs.getString("ProjectID");

			// secondly, test whether this project has any annotation.
			String sqlStatement = "";
			sqlStatement = "SELECT * FROM Annotation WHERE MessageID IN (SELECT MessageID FROM Message WHERE ProjectID = '"
					+ projID + "')";
			rs = stmt.executeQuery(sqlStatement);
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no annotation with this project.");
				return resultObject;
			} else {
				rs = stmt.executeQuery(sqlStatement);
				while (rs.next()) {
					String annotation = rs.getString("Annotation");
					String messageID = rs.getString("MessageID");
					String method = rs.getString("Method");
					String annotator = rs.getString("AnnotatorName");
					String annotationID = rs.getString("AnnotationID");
					JSONObject Annotation = new JSONObject(annotation);

					JSONObject returnedMessage = new JSONObject();
					returnedMessage = getMessageDataUsingID(messageID, databasePath);

					JSONObject oneAnnotation = new JSONObject(returnedMessage.getString("MessageData"));
					oneAnnotation.put("MessageID", messageID);
					oneAnnotation.put("Annotation", Annotation.get("Annotation"));
					oneAnnotation.put("AnnotationID", annotationID);
					oneAnnotation.put("Annotator", annotator);
					oneAnnotation.put("Method", method);

					allAnnotations.put(oneAnnotation);
				}
			}

			/*
			 * try { BufferedWriter writer = new BufferedWriter(new FileWriter(projName +
			 * ".json"));
			 * 
			 * for (int i = 0; i < allAnnotations.length(); i++) {
			 * writer.write(allAnnotations.getJSONObject(i).toString()); writer.newLine(); }
			 * 
			 * writer.close();
			 * 
			 * File file = new File(projName + ".json"); absolutePath =
			 * file.getAbsolutePath(); } catch (IOException e) { e.printStackTrace(); }
			 */
			/*
			 * String jsonString = allAnnotations.toString(); byte[] fileBytes =
			 * jsonString.getBytes(StandardCharsets.UTF_8);
			 */

			rs.close();
			stmt.close();
			c.close();

			resultObject.put("status", "success");
			resultObject.put("success", allAnnotations);
			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	public JSONObject downloadAnnotationsResolved(String projName, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		JSONObject resultObject = new JSONObject();
		JSONArray allAnnotations = new JSONArray();

		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no project with this name.");
				return resultObject;
			}
			String projID = rs.getString("ProjectID");
			int annotatorNumber = rs.getInt("annotatorNumber");

			// secondly, test whether this project has any annotation.
			rs = stmt.executeQuery(
					"SELECT * FROM Annotation WHERE MessageID IN (SELECT MessageID FROM Message WHERE ProjectID = '"
							+ projID + "')");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no annotation with this project.");
				return resultObject;
			}

			// thirdly, retrieve annotations with their method as "Resolve";
			rs = stmt.executeQuery(
					"SELECT * FROM Annotation WHERE method = 'Resolve' AND MessageID IN (SELECT MessageID FROM Message WHERE ProjectID = '"
							+ projID + "')");
			while (rs.next()) {
				String annotation = rs.getString("Annotation");
				String messageID = rs.getString("MessageID");
				String annotationID = rs.getString("AnnotationID");
				JSONObject Annotation = new JSONObject(annotation);

				JSONObject returnedMessage = new JSONObject();
				returnedMessage = getMessageDataUsingID(messageID, databasePath);

				JSONObject oneAnnotation = new JSONObject(returnedMessage.getString("MessageData"));
				oneAnnotation.put("Annotation", Annotation.get("Annotation"));
				oneAnnotation.put("AnnotationID", annotationID);
				oneAnnotation.put("MessageID", messageID);

				allAnnotations.put(oneAnnotation);
			}

			// fourth, retrieve annotations which are the same, and keep only one of them;
			rs = stmt.executeQuery("SELECT * FROM Message WHERE ProjectID = '" + projID
					+ "' AND MessageID IN (SELECT MessageID FROM Annotation GROUP BY MessageID HAVING COUNT(MessageID) = "
					+ annotatorNumber
					+ ") AND MessageID IN (SELECT MessageID FROM Annotation WHERE method != 'Resolve')");
			while (rs.next()) {
				String messageID = rs.getString("MessageID");

				JSONObject returnedMessage = new JSONObject();
				returnedMessage = getMessageDataUsingID(messageID, databasePath);

				JSONObject annotations = new JSONObject();
				annotations = getAnnotationUsingID(messageID, databasePath);

				if (compareAnnotationsOfOneMsg(annotations.get("success"))) {
					JSONObject oneAnnotation = new JSONObject(returnedMessage.getString("MessageData"));
					JSONArray theSameAnnotations = new JSONArray();
					if (annotations.get("success") instanceof JSONArray) {
						theSameAnnotations = (JSONArray) annotations.get("success");
					}
					
					int maxPointsNum = Integer.MIN_VALUE;
					int indexMax = 0;
					for (int i = 0; i < theSameAnnotations.length(); i++) {
						JSONObject annotationAndAnnotator = theSameAnnotations.getJSONObject(i);
						Object annotationWholeObject = annotationAndAnnotator.get("Annotation");
						String annotationString = (String) annotationWholeObject;
						JSONObject annotationJsonObject = new JSONObject(annotationString);
						Object annotationObject = annotationJsonObject.getJSONArray("Annotation");
						JSONArray annotationArray = new JSONArray();
						if (annotationObject instanceof JSONArray) {
							annotationArray = (JSONArray) annotationObject;
						}
						Object spatialFoorprint = annotationArray.getJSONObject(0).getJSONArray("spatialFootprint");
						JSONArray spatialFoorprintArray = new JSONArray();
						if (spatialFoorprint instanceof JSONArray) {
							spatialFoorprintArray = (JSONArray) spatialFoorprint;
						}
						int pointNum = 0;
						for (int m = 0; m < spatialFoorprintArray.length(); m++) {
							JSONArray geometryArray = new JSONArray();
							Object geometryObject = spatialFoorprintArray.getJSONObject(m).get("geometry");
							if (geometryObject instanceof JSONArray) {
								geometryArray = (JSONArray) geometryObject;
							}
							for (int n = 0; n < geometryArray.length(); n++) {
								Coordinate[] coords = createCoordinateJTS(geometryArray.getJSONObject(n));
								pointNum = pointNum + coords.length;
							}
						}
						
						if (pointNum > maxPointsNum) {
							maxPointsNum = pointNum;
							indexMax = i;
						}
					}
					
					JSONObject oneTheSameAnnotation = theSameAnnotations.getJSONObject(indexMax);
					String annotationID = oneTheSameAnnotation.getString("AnnotationID");
					JSONObject oneTheSameAnnotationPure = new JSONObject(oneTheSameAnnotation.getString("Annotation"));
					oneAnnotation.put("Annotation", oneTheSameAnnotationPure.get("Annotation"));
					oneAnnotation.put("AnnotationID", annotationID);
					oneAnnotation.put("MessageID", messageID);
					allAnnotations.put(oneAnnotation);
				}
			}

			rs.close();
			stmt.close();
			c.close();

			resultObject.put("status", "success");
			resultObject.put("success", allAnnotations);
			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	public JSONObject getMessageDataUsingID(String messageID, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Message WHERE MessageID = '" + messageID + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no message with this ID.");
				return resultObject;
			}
			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("MessageData", rs.getString("MessageData"));

			rs.close();
			stmt.close();
			c.close();

			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	// retrieve messages with different annotations
	public JSONObject retrieveResolvingAnnotations(String projName, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);
			JSONObject resultObject = new JSONObject();
			// JSONArray allResolveAnnotations = new JSONArray();
			JSONObject oneResolveAnnotation = new JSONObject();

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no project with this name.");
				return resultObject;
			}
			String projID = rs.getString("ProjectID");
			int annotatorNumber = rs.getInt("annotatorNumber");

			// secondly, test whether this project has any annotation.
			rs = stmt.executeQuery(
					"SELECT * FROM Annotation WHERE MessageID IN (SELECT MessageID FROM Message WHERE ProjectID = '"
							+ projID + "')");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no annotation with this project.");
				return resultObject;
			}

			boolean foundData = false;

			rs = stmt.executeQuery("SELECT * FROM Message WHERE ProjectID = '" + projID
					+ "' AND MessageID IN (SELECT MessageID FROM Annotation GROUP BY MessageID HAVING COUNT(MessageID) = "
					+ annotatorNumber
					+ ") AND MessageID IN (SELECT MessageID FROM Annotation WHERE method != 'Resolve')");
			while (rs.next()) {
				String messageID = rs.getString("MessageID");

				JSONObject thisMessage = new JSONObject();
				thisMessage = getMessageDataUsingID(messageID, databasePath);

				JSONObject annotations = new JSONObject();
				annotations = getAnnotationUsingID(messageID, databasePath);

//				oneResolveAnnotation.put("MessageID", messageID);
//				oneResolveAnnotation.put("Message", thisMessage.get("MessageData"));
//				oneResolveAnnotation.put("Annotation", annotations.get("success"));
//				
//				resultObject.put("status", "success");
//				resultObject.put("success", oneResolveAnnotation);
//
//				foundData = true;
//				break;

				if (!compareAnnotationsOfOneMsg(annotations.get("success"))) {
					oneResolveAnnotation.put("MessageID", messageID);
					oneResolveAnnotation.put("Message", thisMessage.get("MessageData"));
					oneResolveAnnotation.put("Annotation", annotations.get("success"));

					resultObject.put("status", "success");
					resultObject.put("success", oneResolveAnnotation);

					foundData = true;
					break;
				}
			}

			if (!foundData) {
				resultObject.put("status", "failure");
				resultObject.put("error", "noDisagreements");
			}

			rs.close();
			stmt.close();
			c.close();

			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	public Boolean compareAnnotationsOfOneMsg(Object annotationsOfOneMsg) {
		Boolean isTheSame = true;
		JSONArray allAnnotations = new JSONArray();
		if (annotationsOfOneMsg instanceof JSONArray) {
			allAnnotations = (JSONArray) annotationsOfOneMsg;
		}

		JSONArray annotationsComparing = new JSONArray();

		for (int i = 0; i < allAnnotations.length(); i++) {
			JSONObject annotationAndAnnotator = allAnnotations.getJSONObject(i);
			Object annotationObject = annotationAndAnnotator.get("Annotation");
			String annotationString = (String) annotationObject;
			JSONObject annotation = new JSONObject(annotationString);
			annotationsComparing.put(annotation);
		}

		// Comparing the number of location descriptions of each annotation.
		int previousLength = -1;
		for (int i = 0; i < annotationsComparing.length(); i++) {
			JSONObject annotationJsonObject = annotationsComparing.getJSONObject(i);
			Object annotationObject = annotationJsonObject.getJSONArray("Annotation");
			JSONArray annotationArray = new JSONArray();
			if (annotationObject instanceof JSONArray) {
				annotationArray = (JSONArray) annotationObject;
			}

			int currentLength = annotationArray.length();

			if (previousLength != -1 && currentLength != previousLength) {
				isTheSame = false;
				return isTheSame;
			}
			previousLength = currentLength;
		}

		// If the number is the same, ranking the annotations based on their start
		// index.
		if (isTheSame) {
			JSONArray sortedAnnotationsComparing = new JSONArray();
			for (int i = 0; i < annotationsComparing.length(); i++) {
				JSONObject annotationJsonObject = annotationsComparing.getJSONObject(i);
				Object annotationObject = annotationJsonObject.getJSONArray("Annotation");
				JSONArray annotationArray = new JSONArray();
				if (annotationObject instanceof JSONArray) {
					annotationArray = (JSONArray) annotationObject;
				}

				List<JSONObject> annotationList = new ArrayList<>();
				for (int j = 0; j < annotationArray.length(); j++) {
					annotationList.add(annotationArray.getJSONObject(j));
				}

				Collections.sort(annotationList, new Comparator<JSONObject>() {
					@Override
					public int compare(JSONObject o1, JSONObject o2) {
						int startIndex1 = o1.getInt("startIdx");
						int startIndex2 = o2.getInt("startIdx");
						return Integer.compare(startIndex1, startIndex2);
					}
				});

				JSONArray sortedAnnotationArray = new JSONArray(annotationList);

				JSONObject sortedAnnotationObject = new JSONObject();
				sortedAnnotationObject.put("Annotation", sortedAnnotationArray);

				sortedAnnotationsComparing.put(sortedAnnotationObject);
			}

			isTheSame = compareCorrespondingSingleAnnotation(sortedAnnotationsComparing);
		}

		return isTheSame;
	}

	public boolean compareCorrespondingSingleAnnotation(JSONArray annotations) {
		boolean isTheSame = true;

		// compute the number of location descriptions in each message.
		Object annotationExample = annotations.getJSONObject(0).getJSONArray("Annotation");
		JSONArray annotationArrayExample = new JSONArray();
		if (annotationExample instanceof JSONArray) {
			annotationArrayExample = (JSONArray) annotationExample;
		}
		int numOfAnnotationsEachMsg = annotationArrayExample.length();

		ArrayList<Integer> mostDetailedIndex = new ArrayList<>();

		for (int i = 0; i < numOfAnnotationsEachMsg; i++) {
			List<JSONObject> annotationListComparing = new ArrayList<>();
			for (int j = 0; j < annotations.length(); j++) {
				Object currentAnnotation = annotations.getJSONObject(j).getJSONArray("Annotation");
				JSONArray currentAnnotationArray = new JSONArray();
				if (currentAnnotation instanceof JSONArray) {
					currentAnnotationArray = (JSONArray) currentAnnotation;
				}
				annotationListComparing.add(currentAnnotationArray.getJSONObject(i));
			}

			// comparing startIdx, endIdx, location text, and other components.
			for (int m = 0; m < annotationListComparing.size(); m++) {
				for (int n = m + 1; n < annotationListComparing.size(); n++) {
					if (!compareLocaDescPair(annotationListComparing.get(m), annotationListComparing.get(n))) {
						isTheSame = false;
						return isTheSame;
					}
				}
			}

			// comparing the number of points of the spatial footprints.
			int indexMax = 0;
			int maxPointsNum = Integer.MIN_VALUE;
			for (int m = 0; m < annotationListComparing.size(); m++) {
				Object spatialFootprint = annotationListComparing.get(m).getJSONArray("spatialFootprint");
				JSONArray spatialFootprintArray = new JSONArray();
				if (spatialFootprint instanceof JSONArray) {
					spatialFootprintArray = (JSONArray) spatialFootprint;
				}
				int pointNum = 0;
				for (int p = 0; p < spatialFootprintArray.length(); p++) {					
					Object geometryObject = spatialFootprintArray.getJSONObject(p).get("geometry");
					JSONArray geometryArray = new JSONArray();
					if (geometryObject instanceof JSONArray) {
						geometryArray = (JSONArray) geometryObject;
					}
					for (int q = 0; q < geometryArray.length(); q++) {
						Coordinate[] coords = createCoordinateJTS(geometryArray.getJSONObject(q));
						pointNum = pointNum + coords.length;
					}
				}

				if (pointNum > maxPointsNum) {
					maxPointsNum = pointNum;
					indexMax = m;
				}
			}
			mostDetailedIndex.add(indexMax);
		}

		if (isTheSame) {
			for (int i = 1; i < mostDetailedIndex.size(); i++) {
				if (mostDetailedIndex.get(i) != mostDetailedIndex.get(0)) {
					isTheSame = false;
					return isTheSame;
				}
			}
		}

		return isTheSame;
	}

	public boolean compareLocaDescPair(JSONObject obj1, JSONObject obj2) {
		int startidx1 = obj1.getInt("startIdx");
		int startidx2 = obj2.getInt("startIdx");
		int endidx1 = obj1.getInt("endIdx");
		int endidx2 = obj2.getInt("endIdx");
		String locationDesc1 = obj1.getString("locationDesc");
		String locationDesc2 = obj2.getString("locationDesc");
		String locationCate1 = obj1.getString("locationCate");
		String locationCate2 = obj2.getString("locationCate");
		Object spatialFoorprint1 = obj1.getJSONArray("spatialFootprint");
		JSONArray spatialFoorprintArry1 = new JSONArray();
		if (spatialFoorprint1 instanceof JSONArray) {
			spatialFoorprintArry1 = (JSONArray) spatialFoorprint1;
		}

		Object spatialFoorprint2 = obj2.getJSONArray("spatialFootprint");
		JSONArray spatialFoorprintArry2 = new JSONArray();
		if (spatialFoorprint2 instanceof JSONArray) {
			spatialFoorprintArry2 = (JSONArray) spatialFoorprint2;
		}

		return startidx1 == startidx2 && endidx1 == endidx2 && locationDesc1.equals(locationDesc2)
				&& locationCate1.equals(locationCate2)
				&& comparingSpatialFootprint(spatialFoorprintArry1, spatialFoorprintArry2);
	}

	public boolean comparingSpatialFootprint(JSONArray spatialFoorprintArray1, JSONArray spatialFoorprintArray2) {
		boolean isTheSame = true;

		// firstly, comparing the number of spatial footprints
		if (spatialFoorprintArray1.length() != spatialFoorprintArray2.length()) {
			isTheSame = false;
			return isTheSame;
		}

		// secondly, comparing the type of spatial footprints
		if (isTheSame) {
			Set<String> set1 = new HashSet<>();
			Set<String> set2 = new HashSet<>();
			for (int i = 0; i < spatialFoorprintArray1.length(); i++) {
				set1.add(spatialFoorprintArray1.getJSONObject(i).getString("type"));
			}
			for (int i = 0; i < spatialFoorprintArray2.length(); i++) {
				set2.add(spatialFoorprintArray2.getJSONObject(i).getString("type"));
			}
			if (!set1.equals(set2)) {
				isTheSame = false;
				return isTheSame;
			}

			// thirdly, comparing the spatial footprints using bounding box;
			if (isTheSame) {
				for (String element : set1) {
					JSONArray sFJsonArray1 = new JSONArray();
					JSONArray sFJsonArray2 = new JSONArray();
					for (int i = 0; i < spatialFoorprintArray1.length(); i++) {
						if (spatialFoorprintArray1.getJSONObject(i).getString("type").equals(element)) {
							Object sFObject1 = spatialFoorprintArray1.getJSONObject(i).get("geometry");
							if (sFObject1 instanceof JSONArray) {
								sFJsonArray1 = (JSONArray) sFObject1;
							}
						}
					}
					for (int i = 0; i < spatialFoorprintArray2.length(); i++) {
						if (spatialFoorprintArray2.getJSONObject(i).getString("type").equals(element)) {
							Object sFObject2 = spatialFoorprintArray2.getJSONObject(i).get("geometry");
							if (sFObject2 instanceof JSONArray) {
								sFJsonArray2 = (JSONArray) sFObject2;
							}
						}
					}

					if (element.equals("Point")) {
						if ((sFJsonArray1.length() == 1) && (sFJsonArray2.length() == 1)) {
							GeodeticCalculator calculator = new GeodeticCalculator();
							JSONObject sFJsonObject1 = sFJsonArray1.getJSONObject(0);
							Coordinate[] coords1 = createCoordinateJTS(sFJsonObject1);

							JSONObject sFJsonObject2 = sFJsonArray2.getJSONObject(0);
							Coordinate[] coords2 = createCoordinateJTS(sFJsonObject2);

							calculator.setStartingGeographicPoint(coords1[0].getX(), coords1[0].getY());
							calculator.setDestinationGeographicPoint(coords2[0].getX(), coords2[0].getY());

							double distance = calculator.getOrthodromicDistance();
							if (distance > 1000) {
								isTheSame = false;
								return isTheSame;
							}
						} else if (((sFJsonArray1.length() == 1) || (sFJsonArray2.length() == 1))
								&& (sFJsonArray1.length() != sFJsonArray2.length())) {
							isTheSame = false;
							return isTheSame;
						} else {
							double interRatio = computeInterRatio(sFJsonArray1, sFJsonArray2);
							if (interRatio < 0.8) {
								isTheSame = false;
								return isTheSame;
							}
						}
					} else {
						double interRatio = computeInterRatio(sFJsonArray1, sFJsonArray2);
						if (interRatio < 0.8) {
							isTheSame = false;
							return isTheSame;
						}
					}
				}
			}
		}

		return isTheSame;
	}

	public Coordinate[] createCoordinateJTS(JSONObject spatialFootprintObj) {
		JSONArray coordinatesArray = new JSONArray();
		if (spatialFootprintObj.getString("type").equals("Point")) {
			Object coordinatesObject = spatialFootprintObj.get("coordinates");
			JSONArray pointCoordinatesArray = new JSONArray();
			if (coordinatesObject instanceof JSONArray) {
				pointCoordinatesArray = (JSONArray) coordinatesObject;
			}
			coordinatesArray.put(pointCoordinatesArray);
		} else if (spatialFootprintObj.getString("type").equals("Polygon")) {
			Object coordinatesObject = spatialFootprintObj.get("coordinates");
			if (coordinatesObject instanceof JSONArray) {
				coordinatesArray = (JSONArray) coordinatesObject;
			}
			coordinatesArray = coordinatesArray.getJSONArray(0);
		} else {
			Object coordinatesObject = spatialFootprintObj.get("coordinates");
			if (coordinatesObject instanceof JSONArray) {
				coordinatesArray = (JSONArray) coordinatesObject;
			}
		}

		Coordinate[] coords = new Coordinate[coordinatesArray.length()];

		for (int i = 0; i < coordinatesArray.length(); i++) {
			JSONArray jsonCoord = coordinatesArray.getJSONArray(i);
			BigDecimal longitude = (BigDecimal) jsonCoord.get(0);
			BigDecimal latitude = (BigDecimal) jsonCoord.get(1);
			double lon = longitude.doubleValue();
			double lat = latitude.doubleValue();
			coords[i] = new Coordinate(lon, lat);
		}
		return coords;
	}

	public double computeInterRatio(JSONArray geoJsonArray1, JSONArray geoJsonArray2) {
		int totalCoordinateCount1 = 0;
		for (int m = 0; m < geoJsonArray1.length(); m++) {
			JSONObject sFJsonObject1 = geoJsonArray1.getJSONObject(m);
			Coordinate[] coords1 = createCoordinateJTS(sFJsonObject1);
			totalCoordinateCount1 += coords1.length;
		}
		Coordinate[] combinedCoords1 = new Coordinate[totalCoordinateCount1];
		int currentIndex1 = 0;
		for (int m = 0; m < geoJsonArray1.length(); m++) {
			JSONObject sFJsonObject1 = geoJsonArray1.getJSONObject(m);
			Coordinate[] coords1 = createCoordinateJTS(sFJsonObject1);
			System.arraycopy(coords1, 0, combinedCoords1, currentIndex1, coords1.length);
			currentIndex1 += coords1.length;
		}
		double minX1 = Double.POSITIVE_INFINITY;
		double minY1 = Double.POSITIVE_INFINITY;
		double maxX1 = Double.NEGATIVE_INFINITY;
		double maxY1 = Double.NEGATIVE_INFINITY;
		for (Coordinate coord : combinedCoords1) {
			double x = coord.getX();
			double y = coord.getY();
			minX1 = Math.min(minX1, x);
			minY1 = Math.min(minY1, y);
			maxX1 = Math.max(maxX1, x);
			maxY1 = Math.max(maxY1, y);
		}
		Envelope boundingBox1 = new Envelope(minX1, maxX1, minY1, maxY1);
		double area1 = boundingBox1.getWidth() * boundingBox1.getHeight();

		int totalCoordinateCount2 = 0;
		for (int m = 0; m < geoJsonArray2.length(); m++) {
			JSONObject sFJsonObject2 = geoJsonArray2.getJSONObject(m);
			Coordinate[] coords2 = createCoordinateJTS(sFJsonObject2);
			totalCoordinateCount2 += coords2.length;
		}
		Coordinate[] combinedCoords2 = new Coordinate[totalCoordinateCount2];
		int currentIndex2 = 0;
		for (int m = 0; m < geoJsonArray2.length(); m++) {
			JSONObject sFJsonObject2 = geoJsonArray2.getJSONObject(m);
			Coordinate[] coords2 = createCoordinateJTS(sFJsonObject2);
			System.arraycopy(coords2, 0, combinedCoords2, currentIndex2, coords2.length);
			currentIndex2 += coords2.length;
		}
		double minX2 = Double.POSITIVE_INFINITY;
		double minY2 = Double.POSITIVE_INFINITY;
		double maxX2 = Double.NEGATIVE_INFINITY;
		double maxY2 = Double.NEGATIVE_INFINITY;
		for (Coordinate coord : combinedCoords2) {
			double x = coord.getX();
			double y = coord.getY();
			minX2 = Math.min(minX2, x);
			minY2 = Math.min(minY2, y);
			maxX2 = Math.max(maxX2, x);
			maxY2 = Math.max(maxY2, y);
		}
		Envelope boundingBox2 = new Envelope(minX2, maxX2, minY2, maxY2);
		double area2 = boundingBox2.getWidth() * boundingBox2.getHeight();

		Envelope intersection = boundingBox1.intersection(boundingBox2);
		double areaIntersection = intersection.getWidth() * intersection.getHeight();
		double minArea = Math.min(area1, area2);
		double interRatio = areaIntersection / minArea;

		return interRatio;
	}

//	public boolean comparingSpatialFootprint(JSONArray spatialFoorprintArray1, JSONArray spatialFoorprintArray2) {
//		boolean isTheSame = true;
//
//		String spatialType1 = spatialFoorprintArray1.getJSONObject(0).getString("type");
//		String spatialType2 = spatialFoorprintArray2.getJSONObject(0).getString("type");
//		if (!spatialType1.equals(spatialType2)) {
//			isTheSame = false;
//			return isTheSame;
//		}
//
//		if (isTheSame) {
//			if (spatialFoorprintArray1.getJSONObject(0).getString("type").equals("Point")) {
//				GeodeticCalculator calculator = new GeodeticCalculator();
//
//				Object coordinatesObject1 = spatialFoorprintArray1.getJSONObject(0).get("coordinates");
//				JSONArray coordinatesArray1 = new JSONArray();
//				if (coordinatesObject1 instanceof JSONArray) {
//					coordinatesArray1 = (JSONArray) coordinatesObject1;
//				}
//				BigDecimal longitude1 = (BigDecimal) coordinatesArray1.get(0);
//				BigDecimal latitude1 = (BigDecimal) coordinatesArray1.get(1);
//				double longitudeValue1 = longitude1.doubleValue();
//				double latitudeValue1 = latitude1.doubleValue();
//
//				Object coordinatesObject2 = spatialFoorprintArray2.getJSONObject(0).get("coordinates");
//				JSONArray coordinatesArray2 = new JSONArray();
//				if (coordinatesObject2 instanceof JSONArray) {
//					coordinatesArray2 = (JSONArray) coordinatesObject2;
//				}
//				BigDecimal longitude2 = (BigDecimal) coordinatesArray2.get(0);
//				BigDecimal latitude2 = (BigDecimal) coordinatesArray2.get(1);
//				double longitudeValue2 = longitude2.doubleValue();
//				double latitudeValue2 = latitude2.doubleValue();
//
//				calculator.setStartingGeographicPoint(longitudeValue1, latitudeValue1);
//				calculator.setDestinationGeographicPoint(longitudeValue2, latitudeValue2);
//
//				double distance = calculator.getOrthodromicDistance();
//				if (distance > 1000) {
//					isTheSame = false;
//					return isTheSame;
//				}
//			}
//
//			GeometryFactory geometryFactory = new GeometryFactory();
//			double maxMinFrechetDistance = Double.MIN_VALUE;
//			if (spatialFoorprintArray1.getJSONObject(0).getString("type").equals("LineString")) {
//				for (int i = 0; i < spatialFoorprintArray1.length(); i++) {
//					JSONObject sFJsonObject1 = spatialFoorprintArray1.getJSONObject(i);
//					Coordinate[] coords1 = createCoordinateJTS(sFJsonObject1);
//					LineString lingstring1 = geometryFactory.createLineString(coords1);
//					double minFrechetDistance = Double.MAX_VALUE;
//					for (int j = 0; j < spatialFoorprintArray2.length(); j++) {
//						JSONObject sFJsonObject2 = spatialFoorprintArray2.getJSONObject(j);
//						Coordinate[] coords2 = createCoordinateJTS(sFJsonObject2);
//						LineString lingstring2 = geometryFactory.createLineString(coords2);
//
//						double approximateFrechetDistance = DiscreteFrechetDistance.distance(lingstring1, lingstring2);
//						if (approximateFrechetDistance < minFrechetDistance) {
//							minFrechetDistance = approximateFrechetDistance;
//						}
//					}
//
//					if (minFrechetDistance > maxMinFrechetDistance) {
//						maxMinFrechetDistance = minFrechetDistance;
//					}
//				}
//
//				if (maxMinFrechetDistance > 0.03) {
//					isTheSame = false;
//					return isTheSame;
//				}
//			}
//
//			double maxMinHausdorffDistance = Double.MIN_VALUE;
//			if (spatialFoorprintArray1.getJSONObject(0).getString("type").equals("Polygon")) {
//				for (int i = 0; i < spatialFoorprintArray1.length(); i++) {
//					JSONObject sFJsonObject1 = spatialFoorprintArray1.getJSONObject(i);
//					Coordinate[] coords1 = createCoordinateJTS(sFJsonObject1);
//					Polygon polygon1 = geometryFactory.createPolygon(coords1);
//					double minHausdorffDistance = Double.MAX_VALUE;
//					for (int j = 0; j < spatialFoorprintArray2.length(); j++) {
//						JSONObject sFJsonObject2 = spatialFoorprintArray2.getJSONObject(j);
//						Coordinate[] coords2 = createCoordinateJTS(sFJsonObject2);
//						Polygon polygon2 = geometryFactory.createPolygon(coords2);
//
//						DiscreteHausdorffDistance dist = new DiscreteHausdorffDistance(polygon1, polygon2);
//						double approximateHausdorffDistance = dist.distance();
//						if (approximateHausdorffDistance < minHausdorffDistance) {
//							minHausdorffDistance = approximateHausdorffDistance;
//						}
//					}
//
//					if (minHausdorffDistance > maxMinHausdorffDistance) {
//						maxMinHausdorffDistance = minHausdorffDistance;
//					}
//				}
//
//				if (maxMinHausdorffDistance > 0.03) {
//					isTheSame = false;
//					return isTheSame;
//				}
//			}
//		}
//		return isTheSame;
//	}

	public JSONObject getAnnotationUsingID(String messageID, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Message WHERE MessageID = '" + messageID + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no message with this ID.");
				return resultObject;
			}

			rs = stmt.executeQuery(
					"SELECT * FROM Annotation WHERE Method = 'Annotate' AND MessageID = '" + messageID + "'");
			JSONArray allAnnotations = new JSONArray();
			while (rs.next()) {
				String annotation = rs.getString("Annotation");
				String annotator = rs.getString("AnnotatorName");
				String annotationID = rs.getString("AnnotationID");
				JSONObject thisAnnotation = new JSONObject();
				thisAnnotation.put("Annotation", annotation);
				thisAnnotation.put("Annotator", annotator);
				thisAnnotation.put("AnnotationID", annotationID);
				allAnnotations.put(thisAnnotation);
			}

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("success", allAnnotations);

			rs.close();
			stmt.close();
			c.close();

			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	public JSONObject checkStatus(String projName, String databasePath) {
		Connection c = null;
		Statement stmt = null;

		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no project with this name.");
				return resultObject;
			}
			String projID = rs.getString("ProjectID");
			int annotatorNumber = rs.getInt("annotatorNumber");

			// secondly, calculate the number of messages in this project;
			rs = stmt.executeQuery("SELECT COUNT(*) as count FROM Message WHERE ProjectID = '" + projID + "'");
			int msgCount = rs.getInt("count");

			// thirdly, calculate the number of messages with sufficient annotations;
			rs = stmt.executeQuery("SELECT COUNT(*) as count FROM Message WHERE ProjectID = '" + projID
					+ "' AND MessageID IN (SELECT MessageID FROM Annotation GROUP BY MessageID HAVING COUNT(CASE WHEN method = 'Resolve' THEN NULL ELSE MessageID END) = "
					+ annotatorNumber + ")");
			int msgSufficientAnnotationCount = rs.getInt("count");
			int msgInSufficientAnnotationCount = msgCount - msgSufficientAnnotationCount;

			// fourth, calculate the number of messages with sufficient annotation, and
			// these annotations are either the same or resolved.
			int msgNeedingResolved = 0;
			rs = stmt.executeQuery("SELECT * FROM Message WHERE ProjectID = '" + projID
					+ "' AND MessageID IN (SELECT MessageID FROM Annotation GROUP BY MessageID HAVING COUNT(MessageID) = "
					+ annotatorNumber
					+ ") AND MessageID IN (SELECT MessageID FROM Annotation WHERE method != 'Resolve')");
			while (rs.next()) {
				String messageID = rs.getString("MessageID");
				JSONObject annotations = new JSONObject();
				annotations = getAnnotationUsingID(messageID, databasePath);

				if (!compareAnnotationsOfOneMsg(annotations.get("success"))) {
					msgNeedingResolved++;
				}
			}

			int msgResolvedOrSame = msgSufficientAnnotationCount - msgNeedingResolved;

			rs.close();
			stmt.close();
			c.close();
			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("msgCount", msgCount);
			resultObject.put("msgSufficientAnnotationCount", msgSufficientAnnotationCount);
			resultObject.put("msgInSufficientAnnotationCount", msgInSufficientAnnotationCount);
			resultObject.put("msgResolvedOrSame", msgResolvedOrSame);
			resultObject.put("msgNeedingResolved", msgNeedingResolved);
			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}
}
