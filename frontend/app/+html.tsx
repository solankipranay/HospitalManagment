import React from "react";
import { ScrollViewStyleReset } from "expo-router/html";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>CarePulse - Hospital Management System</title>

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0066CC" />

        {/* iOS Safari PWA support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CarePulse" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
