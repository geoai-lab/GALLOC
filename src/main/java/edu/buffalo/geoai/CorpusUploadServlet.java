package edu.buffalo.geoai;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Iterator;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.io.IOUtils;
import org.json.JSONObject;

/**
 * Servlet implementation class CorpusUploadServlet
 */

@WebServlet("/CorpusUploadServlet")
public class CorpusUploadServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	/**
	 * @see HttpServlet#HttpServlet()
	 */
	public CorpusUploadServlet() {
		super();
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		try {
			String pathOfDatabase = getServletContext().getResource(GALLOCConfiguration.database_name).getPath();
			processRequest(request, response, pathOfDatabase);

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		doGet(request, response);
	}

	// process the user's uploaded corpus; each line is a text message
	protected void processRequest(HttpServletRequest request, HttpServletResponse response, String databasePath)
			throws Exception {
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		boolean isMultipart = ServletFileUpload.isMultipartContent(request);
		// if not contain file in the request
		if (!isMultipart) {
			// if not then stop!
			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "failure");
			resultObject.put("error", "An error happened during the uploading process.");

			out.print(resultObject.toString());

			return;
		} else if (isMultipart) {
			FileItemFactory factory = new DiskFileItemFactory();
			ServletFileUpload upload = new ServletFileUpload(factory);

			try {
				// first, read the uploaded data as an input stream and also write the input stream into a temporary file
				List<FileItem> fields = upload.parseRequest(request);
				Iterator<FileItem> it = fields.iterator();

				InputStream intputStream = null;
				String projectName = null;
				File tempFile = null;

				while (it.hasNext()) {
					FileItem fileItem = it.next();
					if (fileItem.getFieldName().equals("dataFile")) {
						intputStream = fileItem.getInputStream();
						
						tempFile = File.createTempFile("inputStreamCopy", ".tmp");

			            // Write input stream to the temporary file
			            try (OutputStream outputStream = new FileOutputStream(tempFile)) {
			                IOUtils.copy(intputStream, outputStream);
			            }
					} else if (fileItem.getFieldName().equals("projName")) {
						projectName = fileItem.getString();
					}
				}

				// second, validate the format of uploading data
				InputStream copyInputStream1 = new FileInputStream(tempFile);
				BufferedReader reader = new BufferedReader(new InputStreamReader(copyInputStream1, "UTF-8"));
				int incorrectLineNumber = 0;
				while (reader.ready()) {
					String thisLine = reader.readLine();	
					incorrectLineNumber++;
					try {
			            // test whether this line is a JsonObject
						JSONObject jsonObjectLine = new JSONObject(thisLine);
						// test whether this JsonObject has an attribute of "text"
						if (!jsonObjectLine.has("text")) {
							reader.close();
							tempFile.delete();
							
							JSONObject resultObject = new JSONObject();
							resultObject.put("status", "incorrectFormat");
							resultObject.put("error", "The format validation fails at line " + incorrectLineNumber + " of the file since this line does not have an attribute of \"text\".");
							out.print(resultObject.toString());

							return;
						}
			        } catch (Exception e) {
			        	reader.close();
						tempFile.delete();
			        	JSONObject resultObject = new JSONObject();
			        	System.err.println(e.getClass().getName() + ": " + e.getMessage());
			        	resultObject.put("status", "incorrectFormat");
						resultObject.put("error", "The format validation fails at line " + incorrectLineNumber + " of the file since this line is not a correct jsonObject.");
						out.print(resultObject.toString());

						return;
			        }
				}
				reader.close();

				// third, obtain the projID of the project
				Connection c = null;
				Statement stmt = null;
				Class.forName("org.sqlite.JDBC");
				c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);
				stmt = c.createStatement();
				ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projectName + "'");
				if (!rs.next()) {
					rs.close();
					stmt.close();
					c.close();
					JSONObject resultObject = new JSONObject();
					resultObject.put("status", "failure");
					resultObject.put("error", "There is no such a project.");
					out.print(resultObject.toString());
					return;
				}
				String projID = rs.getString("ProjectID");

				// fourth, save the uploaded data into database Message table
				InputStream copyInputStream2 = new FileInputStream(tempFile);
				reader = new BufferedReader(new InputStreamReader(copyInputStream2, "UTF-8"));
				int messageCount = 0;
				try {
					c.setAutoCommit(false);

					stmt = c.createStatement();

					while (reader.ready()) {
						String thisLine = reader.readLine();
						thisLine = thisLine.replace("'", "''"); // escape single quotes in the text; otherwise, there
																// will be errors
						// System.out.println(thisLine);
						String messageID = Utils.generateRandomStringID();

						stmt.executeUpdate("INSERT INTO Message(MessageID,ProjectID,MessageData) VALUES('" + messageID
								+ "','" + projID + "','" + thisLine + "')");

						messageCount++;
					}

					reader.close();
					tempFile.delete();
					c.commit();
					c.close();

				} catch (Exception e) {
					c.close();
					tempFile.delete();

					System.err.println(e.getClass().getName() + ": " + e.getMessage());

					JSONObject resultObject = new JSONObject();
					resultObject.put("status", "failure");
					resultObject.put("error", "An error happened during the uploading process.");
					out.print(resultObject.toString());

					return;
				}

				// if everything is successful, write the results into output
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "success");
				resultObject.put("message", "Data file was uploaded successfully. There are " + messageCount
						+ " text messages in this dataset.");

				out.print(resultObject.toString());

			} catch (FileUploadException e) {
				e.printStackTrace();
			}
		}
	}
}
