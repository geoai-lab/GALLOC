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

import org.json.JSONObject;

/**
 * Servlet implementation class UserServlet
 */
@WebServlet("/UserServlet")
public class UserServlet extends HttpServlet 
{
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public UserServlet() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException 
	{
		
		String action = request.getParameter("action");
		JSONObject resultObject = null;
		
		String pathOfDatabase = getServletContext().getResource(GALLOCConfiguration.database_name).getPath();
		if(action.equals("signup"))
		{
			String username = request.getParameter("username");
			String password = request.getParameter("password");
			
			resultObject = signupUser(username,password,pathOfDatabase);
		}
		else if(action.equals("signin"))
		{
			String username = request.getParameter("username");
			String password = request.getParameter("password");
			
			resultObject = signinUser(username,password,pathOfDatabase);
		}
		else if(action.equals("resetPassword"))
		{
			String username = request.getParameter("username");
			String password = request.getParameter("password");
			
			resultObject = resetPassword(username,password,pathOfDatabase);
		}
		
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		if(resultObject != null)
			out.print(resultObject.toString());
		else
			out.print("Servlet Error");
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}
	
	
	// signup a new user into the database
	public JSONObject signupUser(String username, String password, String databasePath) 
	{
		Connection c = null;
		Statement stmt = null;
		try 
		{
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);
			c.setAutoCommit(false);

			// firstly, test whether the username exists 
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '"+username+"'");
			
			if(rs.next())
			{
				rs.close();
				stmt.close();
				c.close();
				
				JSONObject resultObject = new JSONObject();
				resultObject.put("status","failure");
				resultObject.put("error","Username already exists.");
				return resultObject;
			}
			
			
			// else create a new statement
			rs.close();
			stmt.close();
			stmt = c.createStatement();
			stmt.executeUpdate("INSERT INTO User(Username,Password,Project) VALUES('"+username+"','"+password+"','{}')");

			stmt.close();
			c.commit();
			c.close();
			
			JSONObject resultObject = new JSONObject();
			resultObject.put("status","success");
			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}
		
		JSONObject resultObject = new JSONObject();
		resultObject.put("status","failure");
		resultObject.put("error","other internal error.");
		return resultObject;

		
	}
	
	
	
	// reset password for a user
	public JSONObject resetPassword(String username, String password, String databasePath) 
	{
		Connection c = null;
		Statement stmt = null;
		try 
		{
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);
			c.setAutoCommit(false);

			// firstly, test whether the username exists 
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '"+username+"'");
			
			if(!rs.next())
			{
				rs.close();
				stmt.close();
				c.close();
				
				JSONObject resultObject = new JSONObject();
				resultObject.put("status","failure");
				resultObject.put("error","Username does not exist.");
				return resultObject;
			}
			
			
			// else update the password of this user
			rs.close();
			stmt.close();
			stmt = c.createStatement();
			stmt.executeUpdate("UPDATE User SET Password = '"+password+"' WHERE Username = '"+username+"'");

			stmt.close();
			c.commit();
			c.close();
			
			JSONObject resultObject = new JSONObject();
			resultObject.put("status","success");
			return resultObject;

		} catch (Exception e) {
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(0);
		}
		
		JSONObject resultObject = new JSONObject();
		resultObject.put("status","failure");
		resultObject.put("error","other internal error.");
		return resultObject;

		
	}
	
	
	
	// sign in a current user 
	public JSONObject signinUser(String username, String password, String databasePath) 
	{
		Connection c = null;
		Statement stmt = null;
		try 
		{
			Class.forName("org.sqlite.JDBC");
			c = DriverManager.getConnection("jdbc:sqlite:" + databasePath);

			// firstly, test whether the username exists 
			stmt = c.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT * FROM User WHERE Username = '"+username+"' AND Password = '"+password+"'");
			
			JSONObject resultObject = new JSONObject();
			if(rs.next())
			{
				resultObject.put("status","success");
			}
			else
			{
				resultObject.put("status","failure");
				resultObject.put("error","Incorrect username or password.");
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
		resultObject.put("status","failure");
		resultObject.put("error","other internal error.");
		return resultObject;

	}

}
