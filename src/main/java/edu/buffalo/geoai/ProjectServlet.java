package edu.buffalo.geoai;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Servlet implementation class ProjectServlet
 */
@WebServlet("/ProjectServlet")
public class ProjectServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	/**
	 * @see HttpServlet#HttpServlet()
	 */
	public ProjectServlet() {
		super();
		// TODO Auto-generated constructor stub
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		String action = request.getParameter("action");
		JSONObject resultObject = null;

		String pathOfDatabase = getServletContext().getResource(GALLOCConfiguration.database_name).getPath();
		if (action.equals("createProject")) {
			String projName = request.getParameter("projName");
			String projGeo = request.getParameter("geoScope");
			String creator = request.getParameter("creator");
			String categorySchema = request.getParameter("categorySchema");
			String annotatorNumber = request.getParameter("annotatorNumber");
			String batchNumber = request.getParameter("batchNumber");

			resultObject = createProject(projName, projGeo, creator, categorySchema, annotatorNumber, batchNumber,
					pathOfDatabase);
		} else if (action.equals("isProjectExists")) {
			String projName = request.getParameter("projName");

			resultObject = isProjectExists(projName, pathOfDatabase);
		} else if (action.equals("getProjectInfo")) {
			String projName = request.getParameter("projName");

			resultObject = getProjectInfo(projName, "projName", pathOfDatabase);
		} else if (action.equals("getProjectList")) {
			String userName = request.getParameter("username");

			resultObject = getProjectList(userName, pathOfDatabase);
		} else if (action.equals("delProject")) {
			String projName = request.getParameter("projName");

			resultObject = delProject(projName, pathOfDatabase);
		} else if (action.equals("editProject")) {
			String oldProjName = request.getParameter("oldProjName");
			String newProjName = request.getParameter("newProjName");
			String projGeo = request.getParameter("geoScope");
			String categorySchema = request.getParameter("categorySchema");
			String annotatorNumber = request.getParameter("annotatorNumber");
			String batchNumber = request.getParameter("batchNumber");

			resultObject = editProject(oldProjName, newProjName, projGeo, categorySchema, annotatorNumber, batchNumber,
					pathOfDatabase);
		} else if (action.equals("addUserToProject")) {
			String userName = request.getParameter("username");
			String projName = request.getParameter("projName");
			String role = request.getParameter("role");

			resultObject = addUserToProject(userName, projName, role, pathOfDatabase);
		} else if (action.equals("delUserOfProject")) {
			String userName = request.getParameter("username");
			String projName = request.getParameter("projName");

			resultObject = delUserOfProject(userName, projName, pathOfDatabase);
		} else if (action.equals("isDataExists")) {
			String projName = request.getParameter("projName");

			resultObject = isDataExists(projName, pathOfDatabase);
		} else if (action.equals("deleteData")) {
			String projName = request.getParameter("projName");

			resultObject = deleteData(projName, pathOfDatabase);
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

	// create a new project
	public JSONObject createProject(String projName, String projGeo, String creator, String categorySchema,
			String annotatorNumber, String batchNumber, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);
			c.setAutoCommit(false);

			// firstly, test whether the project exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");

			if (rs.next()) {
				rs.close();
				stmt.close();
				c.close();

				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "Project already exists.");
				return resultObject;
			}

			// else create a new statement
			rs.close();

			String administrator = "\"" + creator + "\"";
			String projID = Utils.generateRandomStringID();
			stmt.executeUpdate(
					"INSERT INTO Project (ProjectID, ProjectName, GeoScope, CategorySchema, Creator, Administrators, Annotators, AnnotatorNumber, BatchNumber, PreAnnotators) VALUES ('"
							+ projID + "', '" + projName + "', '" + projGeo + "', '" + categorySchema + "', '" + creator
							+ "', '[" + administrator + "]', '[]', " + annotatorNumber + ", " + batchNumber
							+ ", '[]')");

			// add the project to the user
			JSONObject interimResultObject = addProjectToUser(creator, projID,
					GALLOCConfiguration.user_role_administrator, c);
			String interimResult = interimResultObject.getString("status");

			if (interimResult.equals("success")) {
				c.commit();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "success");
				return resultObject;
			} else {
				c.close();
				return interimResultObject;
			}

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}

		JSONObject resultObject = new JSONObject();
		resultObject.put("status", "failure");
		resultObject.put("error", "other internal error.");
		return resultObject;
	}

	// add a project to its user
	public JSONObject addProjectToUser(String username, String projID, String role, Connection c) {
		try {
			// firstly, test whether the username exists
			Statement stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '" + username + "'");

			if (!rs.next()) {
				rs.close();
				stmt.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "User does not exist; can't link the created project to the user");
				return resultObject;
			}

			// if user exists
			String projectInfo = rs.getString("Project");
			JSONObject projectJsonObject = new JSONObject(projectInfo);
			if (!projectJsonObject.has(role))
				projectJsonObject.put(role, new JSONArray());

			JSONArray projectArray = projectJsonObject.getJSONArray(role);
			projectArray.put(projID);
			projectJsonObject.put(role, projectArray);

			stmt.executeUpdate("UPDATE User SET Project = '" + projectJsonObject.toString() + "' WHERE Username = '"
					+ username + "'");

			stmt.close();

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
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

	// delete a project of a user
	public JSONObject delProjectToUser(String username, String projID, String role, Connection c) {
		try {
			// firstly, test whether the username exists
			Statement stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '" + username + "'");

			if (!rs.next()) {
				rs.close();
				stmt.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "User does not exist; can't delete the project by this user");
				return resultObject;
			}

			// if user exists, delete this project from the project list of this user
			String projectInfo = rs.getString("Project");
			JSONObject projectJsonObject = new JSONObject(projectInfo);

			JSONArray projectArray = projectJsonObject.getJSONArray(role);
			int index = -1;
			for (int i = 0; i < projectArray.length(); i++) {
				if (projID.equals(projectArray.get(i))) {
					index = i;
					break;
				}
			}
			if (index != -1) {
				projectArray.remove(index);
			}
			projectJsonObject.put(role, projectArray);

			stmt.executeUpdate("UPDATE User SET Project = '" + projectJsonObject.toString() + "' WHERE Username = '"
					+ username + "'");

			stmt.close();

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
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

	// check if a project name already exists
	public JSONObject isProjectExists(String projName, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// test whether the projName exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projName + "'");

			JSONObject resultObject = new JSONObject();
			if (rs.next()) {
				resultObject.put("status", "failure");
				resultObject.put("error", "Project name already exists.");
			} else {
				resultObject.put("status", "success");
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

	// Get project info based on project ID or project name
	public JSONObject getProjectInfo(String projQueryString, String nameOrID, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the projID or projName exists
			stmt = c.createStatement();
			ResultSet rs = null;
			if (nameOrID.equals("ID")) {
				rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectID = '" + projQueryString + "'");
			} else {
				rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + projQueryString + "'");
			}

			JSONObject resultObject = new JSONObject();
			// if Yes, get the project information.
			if (rs.next()) {
				resultObject.put("status", "success");
				resultObject.put("ProjectName", rs.getString("ProjectName"));
				resultObject.put("GeoScope", rs.getString("GeoScope"));
				resultObject.put("creator", rs.getString("Creator"));
				resultObject.put("administrators", new JSONArray(rs.getString("Administrators")));
				resultObject.put("annotators", new JSONArray(rs.getString("annotators")));
				resultObject.put("categorySchema", rs.getString("categorySchema"));
				resultObject.put("annotatorNumber", rs.getInt("annotatorNumber"));
				resultObject.put("batchNumber", rs.getInt("batchNumber"));
				resultObject.put("PreAnnotators", new JSONArray(rs.getString("PreAnnotators")));
			// if No, return error.
			} else {
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no project with this name.");
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

	// get project list
	public JSONObject getProjectList(String username, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the username exists
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '" + username + "'");

			if (!rs.next()) {
				rs.close();
				stmt.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "User does not exist; can't find projects with this username.");
				return resultObject;
			}

			// if user exists, retrieve projects with the user as the administrator or annotator. 
			String projectInfo = rs.getString("Project");
			JSONObject projectJsonObject = new JSONObject(projectInfo);
			
			// project list with the user as the administrator
			JSONArray administratedProjectArray = null;
			if (projectJsonObject.has(GALLOCConfiguration.user_role_administrator))
				administratedProjectArray = projectJsonObject.getJSONArray(GALLOCConfiguration.user_role_administrator);
			else
				administratedProjectArray = new JSONArray();
			
			// project list with the user as the annotator
			JSONArray annotatedProjectArray = null;
			if (projectJsonObject.has(GALLOCConfiguration.user_role_annotator))
				annotatedProjectArray = projectJsonObject.getJSONArray(GALLOCConfiguration.user_role_annotator);
			else
				annotatedProjectArray = new JSONArray();

			JSONArray administratedProjectInfoArray = new JSONArray();
			JSONArray annotatedProjectInfoArray = new JSONArray();

			for (int i = 0; i < administratedProjectArray.length(); i++) {
				String projectID = administratedProjectArray.getString(i);
				JSONObject thisProjectInfo = getProjectInfo(projectID, "ID", databasePath);
				thisProjectInfo.remove("status");
				administratedProjectInfoArray.put(thisProjectInfo);
			}

			for (int i = 0; i < annotatedProjectArray.length(); i++) {
				String projectID = annotatedProjectArray.getString(i);
				JSONObject thisProjectInfo = getProjectInfo(projectID, "ID", databasePath);
				thisProjectInfo.remove("status");
				annotatedProjectInfoArray.put(thisProjectInfo);
			}

			stmt.close();
			c.close();

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("proj_administrated", administratedProjectInfoArray);
			resultObject.put("proj_anno", annotatedProjectInfoArray);

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

	// add a user to an existing project
	public JSONObject addUserToProject(String username, String projName, String role, String databasePath) {
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
			String annotators = rs.getString("Annotators");
			String administrators = rs.getString("Administrators");
			JSONArray annotatorsArray = new JSONArray(annotators);
			JSONArray administratorsArray = new JSONArray(administrators);

			// secondly, test whether the username exists
			rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '" + username + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "User does not exist.");
				return resultObject;
			}
			String projectInfo = rs.getString("Project");

			// third, test whether the user has been an user of this role for this project.
			boolean isExisted = false;
			JSONObject projectJsonObject = new JSONObject();
			JSONArray projectArray = new JSONArray();
			
			// add this user to this project as an administrator
			if (role.equals(GALLOCConfiguration.user_role_administrator)) {
				for (int i = 0; i < administratorsArray.length(); i++) {
					if (username.equals(administratorsArray.get(i))) {
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
					resultObject.put("error", "This user has already been an administrator for this project.");
					return resultObject;
				}

				// if user and project exist, and this user is not an administrator of this project, update the "Administrators" field
				// of the project and
				// the "Project" field of the user.
				administratorsArray.put(username);
				stmt.executeUpdate("UPDATE Project SET Administrators = '" + administratorsArray.toString()
						+ "' WHERE ProjectID = '" + projID + "'");

				projectJsonObject = new JSONObject(projectInfo);
				if (!projectJsonObject.has(role))
					projectJsonObject.put(role, new JSONArray());

				projectArray = projectJsonObject.getJSONArray(role);
				projectArray.put(projID);
				projectJsonObject.put(role, projectArray);

				stmt.executeUpdate("UPDATE User SET Project = '" + projectJsonObject.toString() + "' WHERE Username = '"
						+ username + "'");
			// add this user to this project as an annotator
			} else if (role.equals(GALLOCConfiguration.user_role_annotator)) {
				for (int i = 0; i < annotatorsArray.length(); i++) {
					if (username.equals(annotatorsArray.get(i))) {
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
					resultObject.put("error", "This user has already been an annotator for this project.");
					return resultObject;
				}

				// if user and project exist, and this user is not an annotator of this project, update the "Annotators" field
				// of the project and
				// the "Project" field of the user.
				annotatorsArray.put(username);
				stmt.executeUpdate("UPDATE Project SET Annotators = '" + annotatorsArray.toString()
						+ "' WHERE ProjectID = '" + projID + "'");

				projectJsonObject = new JSONObject(projectInfo);
				if (!projectJsonObject.has(role))
					projectJsonObject.put(role, new JSONArray());

				projectArray = projectJsonObject.getJSONArray(role);
				projectArray.put(projID);
				projectJsonObject.put(role, projectArray);

				stmt.executeUpdate("UPDATE User SET Project = '" + projectJsonObject.toString() + "' WHERE Username = '"
						+ username + "'");
			}

			rs.close();
			stmt.close();
			c.close();

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
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

	// delete a user to an existing project
	public JSONObject delUserOfProject(String username, String projName, String databasePath) {
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
			String creator = rs.getString("Creator");
			String annotators = rs.getString("Annotators");
			String administrators = rs.getString("Administrators");
			JSONArray annotatorsArray = new JSONArray(annotators);
			JSONArray administratorsArray = new JSONArray(administrators);

			// secondly, test whether this username exists
			rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '" + username + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "User does not exist.");
				return resultObject;
			}
			String projectInfo = rs.getString("Project");

			// if user and project exist, update the "Annotators" and "Administrators" field of the project.
			// remove this user from the annotators of this project
			int index = -1;
			for (int i = 0; i < annotatorsArray.length(); i++) {
				if (username.equals(annotatorsArray.get(i))) {
					index = i;
					break;
				}
			}

			if (index != -1) {
				annotatorsArray.remove(index);
			}
			
			// remove this user from the administrators of this project
			if (!username.equals(creator)) {
				index = -1;
				for (int i = 0; i < administratorsArray.length(); i++) {
					if (username.equals(administratorsArray.get(i))) {
						index = i;
						break;
					}
				}

				if (index != -1) {
					administratorsArray.remove(index);
				}
			}

			stmt.executeUpdate(
					"UPDATE Project SET Annotators = '" + annotatorsArray.toString() + "', Administrators = '"
							+ administratorsArray.toString() + "' WHERE ProjectID = '" + projID + "'");

			// update the "Project" field of the user
			// remove this project from the project lists that this user can annotate.
			String role = GALLOCConfiguration.user_role_annotator;
			JSONObject projectJsonObject = new JSONObject(projectInfo);
			if (!projectJsonObject.has(role))
				projectJsonObject.put(role, new JSONArray());

			JSONArray projectArray = projectJsonObject.getJSONArray(role);
			index = -1;
			for (int i = 0; i < projectArray.length(); i++) {
				if (projID.equals(projectArray.get(i))) {
					index = i;
					break;
				}
			}
			if (index != -1) {
				projectArray.remove(index);
			}
			projectJsonObject.put(role, projectArray);
			
			// remove this project from the project lists that this user can administrate.
			if (!username.equals(creator)) {
				role = GALLOCConfiguration.user_role_administrator;
				if (!projectJsonObject.has(role))
					projectJsonObject.put(role, new JSONArray());
				projectArray = projectJsonObject.getJSONArray(role);
				index = -1;
				for (int i = 0; i < projectArray.length(); i++) {
					if (projID.equals(projectArray.get(i))) {
						index = i;
						break;
					}
				}
				if (index != -1) {
					projectArray.remove(index);
				}
				projectJsonObject.put(role, projectArray);
			}

			stmt.executeUpdate("UPDATE User SET Project = '" + projectJsonObject.toString() + "' WHERE Username = '"
					+ username + "'");

			rs.close();
			stmt.close();
			c.close();

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
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

	// del a project
	public JSONObject delProject(String projName, String databasePath) {
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
				resultObject.put("error", "There is no such a project.");
				return resultObject;
			}
			String projID = rs.getString("ProjectID");
			String annotators = rs.getString("Annotators");
			String administrators = rs.getString("Administrators");

			// secondly, update the project field of all the users who are an administrator of this project.
			String projectInfo = "";
			String role = "";
			JSONObject projectJsonObject = new JSONObject();
			JSONArray projectArray = new JSONArray();
			int index = -1;

			JSONArray administratorsArray = new JSONArray(administrators);
			for (int i = 0; i < administratorsArray.length(); i++) {
				rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '" + administratorsArray.get(i) + "'");
				projectInfo = rs.getString("Project");
				role = GALLOCConfiguration.user_role_administrator;
				projectJsonObject = new JSONObject(projectInfo);
				projectArray = projectJsonObject.getJSONArray(role);
				for (int j = 0; j < projectArray.length(); j++) {
					if (projID.equals(projectArray.get(j))) {
						index = j;
						break;
					}
				}
				if (index != -1) {
					projectArray.remove(index);
				}
				projectJsonObject.put(role, projectArray);
				stmt.executeUpdate("UPDATE User SET Project = '" + projectJsonObject.toString() + "' WHERE Username = '"
						+ administratorsArray.get(i) + "'");
			}

			// thirdly, update the project field of all the users who are an annotator of this project.
			JSONArray annotatorsArray = new JSONArray(annotators);
			for (int i = 0; i < annotatorsArray.length(); i++) {
				rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '" + annotatorsArray.get(i) + "'");
				projectInfo = rs.getString("Project");
				role = GALLOCConfiguration.user_role_annotator;
				projectJsonObject = new JSONObject(projectInfo);
				projectArray = projectJsonObject.getJSONArray(role);

				index = -1;
				for (int j = 0; j < projectArray.length(); j++) {
					if (projID.equals(projectArray.get(j))) {
						index = j;
						break;
					}
				}
				if (index != -1) {
					projectArray.remove(index);
				}
				projectJsonObject.put(role, projectArray);
				stmt.executeUpdate("UPDATE User SET Project = '" + projectJsonObject.toString() + "' WHERE Username = '"
						+ annotatorsArray.get(i) + "'");
			}
			
			// finally, delete this project.
			stmt.executeUpdate("DELETE FROM Project WHERE ProjectID = '" + projID + "'");

			rs.close();
			stmt.close();
			c.close();

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("msg", "This project has been deleted.");
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

	// edit information of a project
	public JSONObject editProject(String oldProjName, String newProjName, String projGeo, String categorySchema,
			String annotatorNumber, String batchNumber, String databasePath) {
		Connection c = null;
		Statement stmt = null;
		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, select the existing project
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + oldProjName + "'");
			if (!rs.next()) {
				rs.close();
				stmt.close();
				c.close();
				JSONObject resultObject = new JSONObject();
				resultObject.put("status", "failure");
				resultObject.put("error", "There is no such a project.");
				return resultObject;
			}
			String projID = rs.getString("ProjectID");

			// secondly, examine whether the new projName already exists if the new ProjName is different with old ProjName.
			if (!oldProjName.equals(newProjName)) {
				rs = stmt.executeQuery("SELECT * FROM Project WHERE ProjectName = '" + newProjName + "'");
				if (rs.next()) {
					rs.close();
					stmt.close();
					c.close();

					JSONObject resultObject = new JSONObject();
					resultObject.put("status", "failure");
					resultObject.put("error", "This project name has been occupied.");
					return resultObject;
				}
				
				// update information including the project name.
				stmt.executeUpdate("UPDATE Project SET ProjectName = '" + newProjName + "', GeoScope = '" + projGeo
						+ "', CategorySchema = '" + categorySchema + "', AnnotatorNumber = " + annotatorNumber
						+ ", BatchNumber = " + batchNumber + " WHERE ProjectID = '" + projID + "'");
			} else {
				// update information not including the project name.
				stmt.executeUpdate("UPDATE Project SET GeoScope = '" + projGeo + "', CategorySchema = '"
						+ categorySchema + "', AnnotatorNumber = " + annotatorNumber + ", BatchNumber = " + batchNumber
						+ " WHERE ProjectID = '" + projID + "'");
			}
			rs.close();
			stmt.close();
			c.close();

			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("success", "This project has been updated.");
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

	// examine whether a project has any data.
	public JSONObject isDataExists(String projName, String databasePath) {
		Connection c = null;
		Statement stmt = null;

		try {
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether this project exists
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

			// secondly, test whether this project has data
			rs = stmt.executeQuery("SELECT * FROM Message WHERE ProjectID = '" + projID + "'");
			JSONObject resultObject = new JSONObject();
			if (rs.next()) {
				rs = stmt.executeQuery("SELECT COUNT(*) as count FROM Message WHERE ProjectID = '" + projID + "'");
				int rowCount = rs.getInt("count");
				resultObject.put("status", "success");
				resultObject.put("label", "Yes");
				resultObject.put("msg", "This project currently has " + rowCount + " text messages.");
			} else {
				resultObject.put("status", "success");
				resultObject.put("label", "No");
				resultObject.put("msg", "This project has no data.");
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

	// delete data of a project.
	public JSONObject deleteData(String projName, String databasePath) {
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

			// secondly, delete data of this project
			rs = stmt.executeQuery("SELECT COUNT(*) as count FROM Message WHERE ProjectID = '" + projID + "'");
			int rowCount = rs.getInt("count");
			stmt.executeUpdate("DELETE FROM Message WHERE ProjectID = '" + projID + "'");

			rs.close();
			stmt.close();
			c.close();
			JSONObject resultObject = new JSONObject();
			resultObject.put("status", "success");
			resultObject.put("success", rowCount + " text messages in this project have been deleted.");
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
