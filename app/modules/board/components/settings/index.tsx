import { useState } from "react";
import { Popover } from "react-tiny-popover";
import useOai from "../../hooks/oai";

const Settings = () => {
  const { apiKey, endpoint, setApiKey, setEndpoint } = useOai();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <Popover
      isOpen={isPopoverOpen}
      onClickOutside={() => setIsPopoverOpen(false)}
      positions={["top", "right"]} // preferred positions by priority
      content={
        <div className="flex flex-col gap-2 border-[#ffc885] bg-[#ffefd8] mx-2 p-2 border rounded-xl w-[300px] h-[250px]">
          <h2>Ai Config</h2>
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="border-[#ffc885] bg-[#FFF5E6] px-2 py-2 border rounded-xl w-full text-sm outline-none"
            type="text"
            placeholder="http://localhost:1234/v1"
          />
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="border-[#ffc885] bg-[#FFF5E6] px-2 py-2 border rounded-xl w-full text-sm outline-none"
            type="text"
            placeholder="xx-1234"
          />
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
