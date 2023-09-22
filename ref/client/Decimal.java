/* Copyright (C) 2021 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

import java.math.BigDecimal;
import java.math.MathContext;
import java.text.DecimalFormat;

public class Decimal implements Comparable<Decimal>{
    
    // constants
    private static final String NAN_STRING = Double.toString(Double.NaN);
    public static final MathContext MATH_CONTEXT = MathContext.DECIMAL64;
    public static final Decimal ZERO = new Decimal( BigDecimal.ZERO );
    public static final Decimal ONE = new Decimal( BigDecimal.ONE );
    public static final Decimal MINUS_ONE = ONE.negate();
    public static final Decimal INVALID = new Decimal(BigDecimal.valueOf(Long.MIN_VALUE)); // maybe would better to choose 0 as invalid's value, as in at least half of the operations invalid behaves 0 like
    public static final Decimal NaN = new Decimal(BigDecimal.valueOf(Long.MIN_VALUE)) { // we need NaN for bar replacement at the moment, if it can be solved differently remove it
        @Override public long longValue() { return Long.MAX_VALUE; }
        @Override public String toString() { return NAN_STRING;  }
    };
    public static final Decimal ONE_HUNDRED = new Decimal( BigDecimal.valueOf(100) );

    // vars
    private final BigDecimal m_value;
    
    // gets
    @Override public int hashCode() { return m_value.hashCode(); }
    public BigDecimal value() { return m_value; }
    public boolean isZero() { return isZero(m_value); }
    private static boolean isZero(final BigDecimal d) { return d == BigDecimal.ZERO || d.signum() == 0; }
    public boolean isValid() { return this != INVALID && this != NaN; }
    
    public static Decimal get(final BigDecimal v) {
        Decimal result;
        if (v == null) {
            result = INVALID;
        } else if (isZero(v)) {
            result = ZERO;
        } else {
            result = new Decimal(v);
        }
        return result;
    }
    
    public static final Decimal get(final double v) {
        Decimal result;
        if (v == Double.MAX_VALUE) {
            result = INVALID;
        } else if (v == 0) {
            result = ZERO;
        } else if (Double.isNaN(v) || Double.isInfinite(v)) {
            result = NaN;
        } else {
            DecimalFormat df = new DecimalFormat("#");
            df.setMaximumFractionDigits(16);
            result = Decimal.parse(df.format(v));
        }
        return result;
    }
    
    public static Decimal get(final long v) {
        Decimal result;
        if (v == Long.MAX_VALUE) {
            result = INVALID;
        } else if (v == 0) {
            result = ZERO;
        } else {
            result = new Decimal(v);
        }
        return result;
    }

    private Decimal( double value ) {
        BigDecimal bd = new BigDecimal( value, MATH_CONTEXT );
        m_value = bd.setScale( 16, MATH_CONTEXT.getRoundingMode() );
    }
    
    private Decimal( long value ) {
        BigDecimal bd = new BigDecimal( value, MATH_CONTEXT );
        m_value = bd.setScale( 16, MATH_CONTEXT.getRoundingMode() );
    }    
    
    private Decimal( BigDecimal value ) {
        m_value = value.setScale( 16, MATH_CONTEXT.getRoundingMode() );
    }
    
    public static boolean isValidNotZeroValue(Decimal value) { return isValid( value ) && !value.isZero(); }
    public static boolean isValid(Decimal value) { return value != null && value.isValid(); }

    public static Decimal parse( String text ) {
        if( Util.StringIsEmpty(text) ) {
            return null;
        } else if( NAN_STRING.equals(text) ) {
            return NaN;
        } else {
            try {
                text = text.trim().replaceAll(",", "");
                BigDecimal decimal = new BigDecimal( text.toCharArray(), 0, text.length(), MATH_CONTEXT );
                return new Decimal( decimal );
            } catch( NumberFormatException ex ) {
                // ignore
            }
        }
        return null;
    }

    public Decimal negate() {
        return isValid() ? get(m_value.negate()) : this;
    }

    public Decimal add(final Decimal another) {
        return !isValid( another) || another.isZero()  
            ? this 
            : isZero() || !isValid() 
                ? another 
                : get(m_value.add(another.value()));
    }

    public Decimal divide(final Decimal another) {
        Decimal result;
        if (Decimal.ONE.equals(another) || isZero()) {
            result = this;
        } else {
            result = INVALID;
            if (isValid() && isValid(another)) {
                try { // try is rather expensive, so we narrow the scope
                    result = get(m_value.divide(another.value(), MATH_CONTEXT));
                } catch( ArithmeticException ex ) {
                	
                }
            }
        }
        return result;
    }
    
    public Decimal multiply(final Decimal another) {
        return another == null ? null 
            : isZero() || another.isZero() ? ZERO 
                : isValid() && another.isValid() 
                    ? ONE.equals(another) ? this
                        : get(m_value.multiply(another.value()))
                            : INVALID; 
    }
    
    @Override public boolean equals( Object another ) {
        return another instanceof Decimal && compareTo((Decimal)another) == 0;
    }

    @Override public int compareTo( final Decimal another )  {
        return another == this 
            ? 0 
            : another == null 
                ? 1 
                : isValid() 
                    ? another.isValid() 
                        ? m_value.compareTo(another.m_value) 
                        : 1
                    : another.isValid() ? -1 : 0;
    }
    
    public static int compare(Decimal value1, Decimal value2) {
    	return value1.value().compareTo(value2.value());
    }

    @Override public String toString() {
        return isValid() ? m_value.stripTrailingZeros().toPlainString() : "";
    }

    public long longValue() {
        return isValid() ? m_value.longValue() : Long.MAX_VALUE;
    }
}
