/* Copyright (C) 2023 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

import com.ib.client.Types.Method;



public class AdvisorUtil {
	static List<Group> getGroups( String xml) {
		try {
			return getGroups_( xml);
		} catch (IOException e) {
			e.printStackTrace();
			return null;
		}
	}

	static List<Group> getGroups_( String xml) throws IOException {
		List<Group> list = new ArrayList<>();

		Group group = null;
		Account account = null;

		BufferedReader reader = new BufferedReader( new StringReader( xml) );
		String line;
		int state = 0; // 0=none; 1=list of groups; 2=reading group 3=listOfAccts
		while ( (line=reader.readLine()) != null) {
			line = line.trim();

			switch( state) {
				// top of file
				case 0:
					if (line.equals( "<ListOfGroups>")) {
						state = 1;
					}
					break;

				// reading groups
				case 1:
					if (line.equals( "<Group>")) {
						group = new Group();
						state = 2;
					}
					else if (line.equals( "</ListOfGroups>")) {
						state = 0;
					}
					else {
						err( line);
					}
					break;

				// reading group
				case 2:
					if (line.startsWith( "<name>") ) {
						group.name( getVal( line) );
					}
					else if (line.startsWith( "<defaultMethod>")) {
						group.defaultMethod( Method.valueOf( getVal( line) ) );
					}
					else if (line.startsWith( "<defaultSize>")) {
						group.defaultSize( getVal( line) );
					}
					else if (line.startsWith( "<riskCriteria>")) {
						group.riskCriteria( getVal( line) );
					}
					else if (line.startsWith( "<ListOfAccts")) {
						state = 3;
					}
					else if (line.equals( "</Group>")) {
						list.add( group);
						state = 1;
					}
					else {
						err( line);
					}
					break;

				// reading list of accts
				case 3:
					if (line.equals( "</ListOfAccts>")) {
						state = 2;
					}
					else if (line.startsWith( "<Account")) {
						account = new Account();
						state = 4;
					}
					else {
						err( line);
					}
					break;

				// reading account
				case 4:
					if (line.equals( "</Account>")) {
						group.addAccount( account);
						state = 3;
					}
					else if (line.startsWith( "<acct>")) {
						account.acct( getVal( line) );
					}
					else if (line.startsWith( "<amount>")) {
						account.amount( getVal( line) );
					}
					else {
						err( line);
					}
					break;

				// should not happen
				default:
					break;
			}
		}

		return list;
	}

	static List<Alias> getAliases( String xml) {
		try {
			return getAliases_( xml);
		} catch (IOException e) {
			e.printStackTrace();
			return null;
		}
	}

	static List<Alias> getAliases_( String xml) throws IOException {
		List<Alias> list = new ArrayList<>();

		Alias alias = null;

		BufferedReader reader = new BufferedReader( new StringReader( xml) );
		String line;
		int state = 0; // 0=none; 1=list of aliases; 2=reading alias
		while ( (line=reader.readLine() ) != null) {
			line = line.trim();

			switch( state) {
				// top of file
				case 0:
					if (line.equals( "<ListOfAccountAliases>")) {
						state = 1;
					}
					break;

				// reading aliases
				case 1:
					if (line.equals( "<AccountAlias>")) {
						alias = new Alias();
						state = 2;
					}
					else if (line.equals( "</ListOfAccountAliases>")) {
						state = 0;
					}
					else {
						err( line);
					}
					break;

				// reading Alias
				case 2:
					if (line.startsWith( "<account>") ) {
						alias.account( getVal( line) );
					}
					else if (line.startsWith( "<alias>")) {
						alias.alias( getVal( line) );
					}
					else if (line.equals( "</AccountAlias>")) {
						list.add( alias);
						state = 1;
					}
					else {
						err( line);
					}
					break;

				// should not happen
				default:
					break;
			}
		}

		return list;
	}

	private static String getVal(String line) {
		int i1 = line.indexOf( '>');
		int i2 = line.indexOf( '<', 1);
		return line.substring( i1 + 1, i2);
	}

	private static void err(String line) {
		System.out.println( "error " + line);
	}


	public static void main(String[] args) {
		String str = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListOfAccountAliases>\n	<AccountAlias>\n		<account>DF109948</account>\n		<alias>DF109948</alias>\n	</AccountAlias>\n	<AccountAlias>\n		<account>DU109949</account>\n		<alias>DU109949</alias>\n	</AccountAlias>\n	<AccountAlias>\n		<account>DU109950</account>\n		<alias>DU109950</alias>\n	</AccountAlias>\n	<AccountAlias>\n		<account>DU110156</account>\n		<alias>DU110156</alias>\n	</AccountAlias>\n	<AccountAlias>\n		<account>DU110157</account>\n		<alias>DU110157</alias>\n	</AccountAlias>\n	<AccountAlias>\n		<account>DU110158</account>\n		<alias>DU110158</alias>\n	</AccountAlias>\n</ListOfAccountAliases>\n\n";
		List<Alias> aliases = getAliases(str);

		if (aliases != null) {
			AdvisorUtil.err(aliases.toString());
		}
	}

	public static String getGroupsXml(List<Group> groups) {
		StringBuilder buf = new StringBuilder();
		buf.append( "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
		buf.append( "<ListOfGroups>\n");
		for( Group group : groups) {
			buf.append( "<Group>\n");
			buf.append( String.format( "<name>%s</name>%n", group.name() ) );
			buf.append( String.format( "<defaultMethod>%s</defaultMethod>%n", group.defaultMethod() ) );
			buf.append( "<ListOfAccts varName=\"list\"\n>");
			for( Account account : group.accounts() ) {
				buf.append( String.format( "<Account>\n") );
				buf.append( String.format( "<acct>%s</acct>%n", account.acct()) );
				if (account.amount() != null && account.amount().length() > 0) {
					buf.append( String.format( "<amount>%s</amount>%n", account.amount()) );
				}
				buf.append( String.format( "</Account>\n") );
			}
			buf.append( "</ListOfAccts>\n");
			buf.append( "</Group>\n");
		}
		buf.append( "</ListOfGroups>\n");
		return buf.toString();
	}
}
