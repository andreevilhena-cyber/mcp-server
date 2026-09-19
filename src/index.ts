import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { z } from "zod";

const RADAR_API = "https://radar-live-api.andree-vilhena.workers.dev";

async function callRadar(path: string) {
  const response = await fetch(`${RADAR_API}${path}`, {
    headers: {
      Accept: "application/json"
    }
  });

  const text = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: text
    };
  }

  try {
    return {
      ok: true,
      status: response.status,
      data: JSON.parse(text)
    };
  } catch {
    return {
      ok: true,
      status: response.status,
      data: text
    };
  }
}

function asMcpText(result: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

function createServer() {
  const server = new McpServer({
    name: "radar-live",
    version: "1.0.0"
  });

  server.registerTool(
    "radar_live",
    {
      description:
        "Consulta o RADAR LIVE e devolve os jogos de futebol atualmente em análise.",
      inputSchema: z.object({})
    },
    async () => {
      const result = await callRadar("/radar");
      return asMcpText(result);
    }
  );

  server.registerTool(
    "finalistas_live",
    {
      description:
        "Consulta os finalistas atuais do RADAR LIVE, isto é, os jogos que passaram a triagem preliminar para análise mais detalhada.",
      inputSchema: z.object({})
    },
    async () => {
      const result = await callRadar("/finalistas");
      return asMcpText(result);
    }
  );

  server.registerTool(
    "analisar_fixture",
    {
      description:
        "Obtém a análise estatística ao vivo de um jogo específico através do respetivo fixture ID.",
      inputSchema: z.object({
        fixture: z.number().int().positive().describe("Fixture ID do jogo")
      })
    },
    async ({ fixture }) => {
      const result = await callRadar(
        `/analysis?fixture=${encodeURIComponent(String(fixture))}`
      );

      return asMcpText(result);
    }
  );

  server.registerTool(
    "eventos_fixture",
    {
      description:
        "Obtém os eventos ao vivo de um jogo específico, como golos, cartões e substituições, através do respetivo fixture ID.",
      inputSchema: z.object({
        fixture: z.number().int().positive().describe("Fixture ID do jogo")
      })
    },
    async ({ fixture }) => {
      const result = await callRadar(
        `/events?fixture=${encodeURIComponent(String(fixture))}`
      );

      return asMcpText(result);
    }
  );

  return server;
}

export default createMcpHandler(createServer);
