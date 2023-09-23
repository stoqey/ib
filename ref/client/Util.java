/* Copyright (C) 2019 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

import static com.ib.controller.Formats.fmt;

import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import com.ib.controller.ApiController;
import com.ib.controller.ApiController.IContractDetailsHandler;

public class Util {
    public static final String SPACE_SYMBOL = " ";
    public static final String EQUALS_SIGN = "=";

    public static String decimalToStringNoZero(Decimal value) {
        return Decimal.isValidNotZeroValue(value) ? value.toString() : ""; 
    }
    
	public static boolean isValidValue(double value) {
		return value != Double.MAX_VALUE && !Double.isNaN(value) && !Double.isInfinite(value);
	}
    
	public static boolean StringIsEmpty(String str) {
		return str == null || str.length() == 0;
	}

    public static String NormalizeString(String str) {
    	return str != null ? str : "";
    }

    public static int StringCompare(String lhs, String rhs) {
    	return NormalizeString(lhs).compareTo(NormalizeString(rhs));
    }

    public static int StringCompareIgnCase(String lhs, String rhs) {
    	return NormalizeString(lhs).compareToIgnoreCase(NormalizeString(rhs));
    }

    public static boolean listsEqualUnordered(List<?> lhs, List<?> rhs) {
    	if (lhs == rhs)
    		return true;

    	int lhsCount = lhs == null ? 0 : lhs.size();
    	int rhsCount = rhs == null ? 0 : rhs.size();

    	if (lhsCount != rhsCount)
    		return false;

    	if (lhsCount == 0)
    		return true;

    	boolean[] matchedRhsElems = new boolean[rhsCount];

    	for (int lhsIdx = 0; lhsIdx < lhsCount; ++lhsIdx) {
    		Object lhsElem = lhs.get(lhsIdx);
    		int rhsIdx = 0;
    		for (; rhsIdx < rhsCount; ++rhsIdx) {
    			if (matchedRhsElems[rhsIdx]) {
    				continue;
    			}
    			if (lhsElem.equals(rhs.get(rhsIdx))) {
    				matchedRhsElems[rhsIdx] = true;
    				break;
    			}
    		}
    		if (rhsIdx >= rhsCount) {
    			// no matching elem found
    			return false;
    		}
    	}
    	return true;
    }

    public static String LongMaxString(long value) {
        return (value == Long.MAX_VALUE) ? "" : String.valueOf(value);
    }
    
    public static String IntMaxString(int value) {
    	return (value == Integer.MAX_VALUE) ? "" : String.valueOf(value);
    }

    public static String DoubleMaxString(double value) {
        return DoubleMaxString(value, "");
    }
    
    public static String DoubleMaxString(double value, String defValue) {
        return (value == Double.MAX_VALUE) ? defValue : new DecimalFormat("0.########").format(value);
    }
    
    public static String UnixMillisecondsToString(long milliseconds, String dateFormat){
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(dateFormat);
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(milliseconds);
        return simpleDateFormat.format(calendar.getTime());
    }
    
    public static String UnixSecondsToString(long seconds, String dateFormat){
        return UnixMillisecondsToString(seconds * 1000, dateFormat);
    }
    
	public static List<ContractDetails> lookupContract(ApiController controller, Contract contract) {
		if (controller == null) {
			return new ArrayList<>();
		}
		final CompletableFuture<List<ContractDetails>> future = new CompletableFuture<>();
				
		controller.reqContractDetails(contract, new IContractDetailsHandler() {

			private final List<ContractDetails> contractDetails = new ArrayList<>();

			@Override
			public void contractDetails(List<ContractDetails> list) {
				contractDetails.addAll(list);
				future.complete(contractDetails);
			}
		});
		try {
			return future.get();
		} catch (final InterruptedException e) {
			e.printStackTrace();
			Thread.currentThread().interrupt();
			return new ArrayList<>();
		} catch (final ExecutionException e) {
			e.printStackTrace();
			return new ArrayList<>();
		}
	}
	

    public static void appendNonEmptyString(StringBuilder sb, String name, String value, String excludeValue) {
        if (!Util.StringIsEmpty(value) && !value.equals(excludeValue)) {
            sb.append(SPACE_SYMBOL).append(name).append(EQUALS_SIGN).append(value);
        }
    }
    
    public static void appendNonEmptyString(StringBuilder sb, String name, String value) {
        if (!Util.StringIsEmpty(value)) {
            sb.append(SPACE_SYMBOL).append(name).append(EQUALS_SIGN).append(value);
        }
    }

    public static void appendPositiveIntValue(StringBuilder sb, String name, int value) {
        if (value > 0) {
            appendValidIntValue(sb, name, value);
        }
    }

    public static void appendValidIntValue(StringBuilder sb, String name, int value) {
        if (value != Integer.MAX_VALUE) {
            sb.append(SPACE_SYMBOL).append(name).append(EQUALS_SIGN).append(Util.IntMaxString(value));
        }
    }

    public static void appendPositiveDoubleValue(StringBuilder sb, String name, double value) {
        if (value > 0) {
            appendValidDoubleValue(sb, name, value);
        }
    }

    public static void appendValidDoubleValue(StringBuilder sb, String name, double value) {
        if (value != Double.MAX_VALUE) {
            sb.append(SPACE_SYMBOL).append(name).append(EQUALS_SIGN).append(Util.DoubleMaxString(value));
        }
    }

    public static void appendBooleanFlag(StringBuilder sb, String flag, Boolean value) {
        if (value != null && value.booleanValue()) {
            sb.append(SPACE_SYMBOL).append(flag);
        }
    }

    public static void appendBooleanFlag(StringBuilder sb, String flag, int value) {
        if (value > 0) {
            sb.append(SPACE_SYMBOL).append(flag);
        }
    }

    public static void appendValidDoubleValue(StringBuilder sb, String name, String strValue) {
        if (!StringIsEmpty(strValue)) {
            Double value = Double.parseDouble(strValue);
            if (value != Double.MAX_VALUE) {
                sb.append(SPACE_SYMBOL).append(name).append(EQUALS_SIGN).append(fmt(value));
            }
        }
    }

    public static void appendValidLongValue(StringBuilder sb, String name, long value) {
        if (value != Long.MAX_VALUE) {
            sb.append(SPACE_SYMBOL).append(name).append(EQUALS_SIGN).append(Util.LongMaxString(value));
        }
    }
    
}
