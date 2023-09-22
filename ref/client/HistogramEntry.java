/* Copyright (C) 2019 Interactive Brokers LLC. All rights reserved. This code is subject to the terms
 * and conditions of the IB API Non-Commercial License or the IB API Commercial License, as applicable. */

package com.ib.client;

public class HistogramEntry implements Comparable<HistogramEntry> {

    private double price;
    private Decimal size;

    public double price() {
		return price;
	}

	public void price(double price) {
		this.price = price;
	}

	public Decimal size() {
		return size;
	}

	public void size(Decimal size) {
		this.size = size;
	}

	public HistogramEntry(double price, Decimal size) {
        this.price = price;
        this.size = size;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || !(o instanceof HistogramEntry)) return false;
        HistogramEntry he = (HistogramEntry) o;
        return Double.compare(price, he.price) == 0 && Decimal.compare(size, he.size) == 0;
    }

    @Override
    public int hashCode() {
        int result;
        long tempPrice = Double.doubleToLongBits(price);
        result = (int) (tempPrice ^ (tempPrice >>> 32));
        result = 31 * result + size.hashCode();
        return result;
    }

    @Override
    public int compareTo(HistogramEntry he) {
        final int d = Double.compare(price, he.price);
        if (d != 0) {
            return d;
        }
        return Decimal.compare(size, he.size);
    }

    @Override
    public String toString() {
        return "HistogramEntry{" +
                "price=" + price +
                ", size=" + size +
                '}';
    }
}
