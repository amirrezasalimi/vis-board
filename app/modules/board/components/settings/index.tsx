import { useEffect, useRef, useState } from "react";
import { Popover } from "react-tiny-popover";
import useOai from "../../hooks/oai";
import useCanvasAi from "../../hooks/canvas-ai";
import { debounce } from "../../helpers/debounce";
import type { Model } from "openai/resources/models.mjs";
import { SearchableSelect } from "~/shared/components";

const Settings = () => {
  const { apiKey, endpoint, setApiKey, setEndpoint, model, setModel } =
    useOai();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [models, setModels] = useState<Model[]>([]);
  const ai = useCanvasAi();

  const [loadingModels, setLoadingModels] = useState(false);
  const reloadModels = () => {
    setLoadingModels(true);
    ai.getModels()
      .then((models) => {
        if (models) {
          setModels(models);
          if (!model) {
            setModel(models[0].id);
          }
        }
      })
      .finally(() => setLoadingModels(false));
  };

  const debouncedModelsReloader = useRef(debounce(reloadModels, 1000));
  useEffect(() => {
    if (!endpoint.trim()) return;
    debouncedModelsReloader.current();
  }, [endpoint, apiKey]);

  const modelOptions = models.map((m) => ({ id: m.id }));

  return (
    <Popover
      isOpen={isPopoverOpen}
      onClickOutside={() => setIsPopoverOpen(false)}
      positions={["top", "right"]} // preferred positions by priority
      content={
        <div className="z-20 flex flex-col gap-2 bg-[#ffefd8] mx-2 p-2 border border-[#ffc885] rounded-xl w-[300px] h-[250px]">
          <h2>Ai Config</h2>
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="bg-[#FFF5E6] px-2 py-2 border border-[#ffc885] rounded-xl outline-hidden w-full text-sm"
            type="text"
            placeholder="http://localhost:1234/v1"
          />
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-[#FFF5E6] px-2 py-2 border border-[#ffc885] rounded-xl outline-hidden w-full text-sm"
            type="text"
            placeholder="xx-1234"
          />
          {endpoint && !!models?.length && (
            <SearchableSelect
              options={modelOptions}
              selectedOption={model}
              onSelect={setModel}
              placeholder="Select a model"
              searchPlaceholder="Search models..."
              direction="top"
              maxHeight="320px"
            />
          )}
          {!!loadingModels && (
            <div>
              <p>Loading models...</p>
            </div>
          )}
        </div>
      }
    >
      <button
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        className="bottom-2 left-2 z-10 fixed text-[#63AAAA] cursor-pointer"
      >
        Settings
      </button>
    </Popover>
  );
};

export default Settings;
