package edu.buffalo.geoai;

import java.util.Random;

public class Utils 
{
	// generate random ID with 32 characters
	public static String generateRandomStringID() 
	{
		int leftLimit = 97; // letter 'a'
	    int rightLimit = 122; // letter 'z'
	    int targetStringLength = 32;
	    Random random = new Random();
	    StringBuilder buffer = new StringBuilder(targetStringLength);
	    for (int i = 0; i < targetStringLength; i++) {
	        int randomLimitedInt = leftLimit + (int) 
	          (random.nextFloat() * (rightLimit - leftLimit + 1));
	        buffer.append((char) randomLimitedInt);
	    }
	    String generatedString = buffer.toString();

	    return generatedString;
	}
	
	
	public static void main(String[] args)
	{
		System.out.println(Utils.generateRandomStringID());
	}

}


