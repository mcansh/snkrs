import * as React from "react";
import fsp from "fs/promises";
import path from "path";
import type { DataFunctionArgs } from "@remix-run/node";
import satori from "satori";
import type { SatoriOptions } from "satori";

import interRegularFontUrl from "~/styles/fonts/Inter-Regular.woff";
import interBoldFontUrl from "~/styles/fonts/Inter-Bold.woff";
import { prisma } from "~/db.server";
import { getCloudinaryURL } from "~/lib/get-cloudinary-url";

export async function loader({ params }: DataFunctionArgs) {
  if (!params.sneakerId) {
    throw new Response("Not Found", { status: 404 });
  }

  let sneaker = await prisma.sneaker.findUnique({
    where: { id: params.sneakerId },
    include: {
      brand: {
        select: { name: true },
      },
    },
  });

  if (!sneaker) {
    throw new Response("Not Found", { status: 404 });
  }

  let [inter, interBold] = await Promise.all([
    fsp.readFile(path.join(process.cwd(), "public", interRegularFontUrl)),
    fsp.readFile(path.join(process.cwd(), "public", interBoldFontUrl)),
  ]);

  let options: SatoriOptions = {
    width: 800,
    height: 400,
    embedFont: true,
    // debug: true,
    fonts: [
      {
        name: "Inter",
        data: inter,
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: interBold,
        weight: 600,
        style: "normal",
      },
    ],
  };

  let column: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: 300,
    height: 300,
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  };

  let svg = await satori(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        fontSize: 32,
        fontWeight: 600,
        gap: 20,
        margin: "0 20px",
      }}
    >
      <div style={column}>
        <img
          width="100%"
          height="100%"
          style={{ borderRadius: 10 }}
          src={getCloudinaryURL(sneaker.imagePublicId, {
            resize: { width: 400, height: 400, type: "pad" },
          })}
          alt=""
        />
      </div>
      <div style={{ ...column, rowGap: 10 }}>
        <div style={{ marginTop: 40 }}>{sneaker.brand.name}</div>
        <div style={{ fontSize: 28 }}>{sneaker.model}</div>
        <div style={{ fontSize: 20, fontWeight: 400 }}>{sneaker.colorway}</div>
      </div>
    </div>,
    options
  );

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, s-maxage=31536000",
    },
  });
}
