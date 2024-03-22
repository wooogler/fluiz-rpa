import { OpenAI } from "openai";
import "dotenv/config";
import { extractBetweenSymbols } from "./actionEvents";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function updateDataMap(
  dataMap: Map<string, string>,
  inputValues: string[]
) {
  const prompts: Map<string, { value: string; example?: string }[]> = new Map();

  inputValues.forEach((inputValue) => {
    const parts = inputValue.split(">");
    const baseKey = parts[0];
    if (dataMap.has(baseKey)) {
      const extractedValues = parts.slice(1).map((p) => {
        const [value, examplePart] = p.split("(");
        const example = examplePart ? examplePart.slice(0, -1) : undefined;
        return { value, example };
      });
      if (prompts.has(baseKey)) {
        prompts.get(baseKey)?.push(...extractedValues);
      } else {
        prompts.set(baseKey, extractedValues);
      }
    }
  });

  if (prompts.size === 0) {
    return;
  }

  for (const [key, values] of prompts) {
    const filteredValues = values.filter(
      ({ value }) => !dataMap.has(extractBetweenSymbols(value))
    );

    // 이미 모든 값이 있는 경우 요청 안함.
    if (filteredValues.length === 0) {
      continue;
    }

    const keys = key.split(",");
    const prompt = `입력된 JSON에서 정보를 추출하여 JSON 형태로 출력하세요. 정보가 없으면 ""을 출력하세요.

<입력>
{
  ${keys.map((key) => `"${key}": "${dataMap.get(key)}"`).join(",\n  ")}
}

<출력>
{
  ${values
    .map(
      ({ value, example }) =>
        `"${value}": {${value} 값을 여기에 입력하세요${
          example && ` (${example})}`
        }`
    )
    .join(",\n  ")}
}`;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
    });
    const responseJson = response.choices[0].message.content;

    if (responseJson) {
      const responseData = JSON.parse(responseJson);
      for (const [k, v] of Object.entries(responseData)) {
        dataMap.set(k, v as string);
      }
    }
  }
}

export default updateDataMap;
