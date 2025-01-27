import OpenAI from "openai";
import { useLocalStorage } from "~/shared/hooks/use-local-storage";

const useOai = () => {
  const [endpoint, setEndpoint] = useLocalStorage("end_point", "");
  const [apiKey, setApiKey] = useLocalStorage("api_key", "");

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
  };
};

export default useOai;
