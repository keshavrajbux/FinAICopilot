import React from 'react';
import FinancialDataEntry from '@/components/FinancialDataEntry';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>FinAI Copilot - Navigate Your Financial Universe</title>
        <meta name="description" content="AI-powered financial analysis and decision-making tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* FinancialDataEntry now handles its own full-page layout with space background */}
      <FinancialDataEntry />
    </>
  );
}
