import { createServer } from "vite";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const ToastMod = await vite.ssrLoadModule("/src/context/ToastContext.jsx");
  const AuthMod = await vite.ssrLoadModule("/src/context/AuthContext.jsx");
  const AppMod = await vite.ssrLoadModule("/src/App.jsx");

  const pages = ["/", "/auth", "/home", "/about", "/forgot-password", "/reset-password/abc", "/service/abc", "/activity", "/payment/abc", "/channel/abc", "/profile", "/provider", "/nope"];

  for (const path of pages) {
    try {
      const html = renderToString(
        React.createElement(MemoryRouter, { initialEntries: [path] },
          React.createElement(ToastMod.ToastProvider, null,
            React.createElement(AuthMod.AuthProvider, null, React.createElement(AppMod.default))
          )
        )
      );
      const ok = html.length > 0;
      console.log(`✅ /${path.replace(/^\//,"").padEnd(18)} → ${ok ? "rendered " + html.length + " chars" : "EMPTY"}`);
    } catch (e) {
      console.log(`❌ /${path} → ${e.message.split("\n")[0]}`);
    }
  }
} finally {
  await vite.close();
}
process.exit(0);
