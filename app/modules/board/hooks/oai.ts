import OpenAI from "openai";
import { useLocalStorage } from "@uidotdev/usehooks";

const useOai = () => {
  const [endpoint, setEndpoint] = useLocalStorage("end_point", "");
  const [apiKey, setApiKey] = useLocalStorage("api_key", "");
  const [model, setModel] = useLocalStorage("model", "");

  const getOai = () => {
    const oai = new OpenAI({
      apiKey,
      baseURL: endpoint,
      dangerouslyAllowBrowser: true,
    });
    return oai;
  };

  return {
    endpoint,
    setEndpoint,
    apiKey,
    setApiKey,
    getOai,
    model,
    setModel,
  };
};

export default useOai;
