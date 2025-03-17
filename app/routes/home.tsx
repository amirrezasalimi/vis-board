import { makeId } from "~/shared/utils/id";
import type { Route } from "./+types/home";
import { useNavigate } from "react-router";
import { Popover } from "react-tiny-popover";
import {
  GlobalStoreProvider,
  useReactiveGlobalStore,
} from "~/modules/board/hooks/global.store";
import useIniter from "~/modules/board/hooks/init";
import { useState } from "react";
import { Modal } from "~/components/Modal";
import { BoardService } from "~/modules/board/services/board.service";
import { getBoardStore } from "~/modules/board/hooks/board.store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Vis Board - Visual Thinking Space" },
    { name: "description", content: "Create and manage your visual boards" },
  ];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const globalStore = useReactiveGlobalStore();
  const { init } = useIniter(); // Now using the stored newBoardId
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const createNewBoard = async () => {
    setIsCreating(true);
    const newBoardId = makeId(20);
    const title = projectName || "Unknown";

    try {
      // Update global store directly
      globalStore.chats.push(BoardService.createChatEntry(newBoardId, title));
      init(newBoardId);

      // Navigate to the new board
      navigate(`/board/${newBoardId}`);
    } catch (error) {
      console.error("Failed to create board:", error);
      alert("Failed to create board. Please try again.");
    } finally {
      setIsCreating(false);
      setShowModal(false);
      setProjectName("");
    }
  };

  const deleteBoard = (boardId: string) => {
    const index = globalStore.chats.findIndex((chat) => chat.id === boardId);
    const boardStore = getBoardStore(boardId);

    if (index !== -1) {
      globalStore.chats.splice(index, 1);
      boardStore.persistence?.clearData();
    }
    setDeleteTargetId(null);
  };

  const recentBoards = [...globalStore.chats].reverse();

  return (
    <div className="bg-[#FFF5E6] p-8 min-h-screen">
      <div className="mx-auto max-w-4xl">
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="mb-2 font-bold text-[#FF7777] text-4xl">
              Vis Board
            </h1>
            <p className="text-[#FF7777]/70">Your visual thinking space</p>
          </div>
          <button
            onClick={() => setShowInfoModal(true)}
            className="text-[#FF7777]/70 hover:text-[#FF7777] text-sm"
          >
            Learn More
          </button>
        </header>

        <div className="gap-8 grid">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-[#FF7777] text-xl">
              Recent Boards
            </h2>
            <button
              onClick={() => setShowModal(true)}
              disabled={isCreating}
              className="bg-[#FF7777] hover:bg-[#FF7777]/90 disabled:opacity-50 px-4 py-2 rounded-md text-white transition-colors disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "New Board"}
            </button>
          </div>

          <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
            {recentBoards.length === 0 ? (
              <div className="col-span-2 bg-white/50 py-8 border border-[#ffc885]/30 rounded-lg text-center">
                <p className="text-[#FF7777]/70">
                  No boards yet. Create your first one!
                </p>
              </div>
            ) : (
              recentBoards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="group relative bg-white p-4 border border-[#ffc885]/30 hover:border-[#ffc885] rounded-lg transition-all cursor-pointer"
                >
                  <Popover
                    isOpen={deleteTargetId === board.id}
                    positions={["top"]}
                    content={
                      <div className="bg-white shadow-lg p-2 border border-[#ffc885]/30 rounded-lg">
                        <p className="mb-2 text-[#FF7777] text-sm">
                          Delete this board?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBoard(board.id);
                            }}
                            className="bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-white text-sm"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetId(null);
                            }}
                            className="hover:bg-gray-100 px-2 py-1 rounded text-gray-600 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    }
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(board.id);
                      }}
                      className="-top-2 -right-2 absolute flex justify-center items-center bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 rounded-full w-6 h-6 text-white scale-75 group-hover:scale-100 transition-all duration-200 transform"
                    >
                      ×
                    </button>
                  </Popover>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#FF7777] rounded-full w-2 h-2"></div>
                      <h3 className="font-medium text-[#FF7777]/90">
                        {board.title || "Untitled"}
                      </h3>
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 text-[#FF7777]/60 text-sm transition-opacity duration-200">
                      Open →
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info Modal */}
      <Modal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)}>
        <div className="w-[480px] max-w-full">
          <h3 className="mb-4 font-semibold text-[#FF7777] text-lg">
            About Vis Board
          </h3>
          <div className="space-y-4 text-[#FF7777]/70">
            <p className="flex justify-between items-center">
              Deep dive into anything with visual thinking tools
              <a
                href="https://github.com/amirrezasalimi/vis-board"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF7777] text-sm hover:underline"
              >
                View on GitHub →
              </a>
            </p>

            <div className="gap-4 grid grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium text-[#FF7777] text-sm">
                  Key Features
                </h4>
                <ul className="space-y-1 text-sm list-disc list-inside">
                  <li>Distill knowledge from messages</li>
                  <li>Text/voice support</li>
                  <li>Fully configurable canvas</li>
                  <li>Browser-based storage</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-medium text-[#FF7777] text-sm">
                  Getting Started
                </h4>
                <p className="text-sm">
                  Add your OpenAI compatible API key in board
                  <span className="mx-1 text-[#FF7777]">Settings</span>
                  to enable all features.
                </p>
              </div>
            </div>

            {/* Add this warning section */}
            <div className="bg-yellow-50/50 mt-4 p-3 border border-yellow-200 rounded-md">
              <h4 className="mb-1 font-medium text-[#FF7777] text-sm">
                ⚠️ Important Note
              </h4>
              <p className="text-sm">
                All your data is stored locally in your browser. Clearing
                browser data or using private/incognito mode will result in data
                loss. Please export important boards before clearing browser
                data.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Create Board Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="w-80">
          <h3 className="mb-4 font-semibold text-[#FF7777] text-lg">
            Create New Board
          </h3>
          <input
            type="text"
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mb-4 p-2 border border-[#ffc885]/30 focus:border-[#FF7777]/50 rounded-md outline-none w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                createNewBoard();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="hover:bg-[#FFF5E6] px-3 py-1 rounded-md text-[#FF7777]"
            >
              Cancel
            </button>
            <button
              onClick={createNewBoard}
              disabled={isCreating}
              className="bg-[#FF7777] hover:bg-[#FF7777]/90 disabled:opacity-50 px-3 py-1 rounded-md text-white"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default function Home() {
  return (
    <GlobalStoreProvider>
      <Dashboard />
    </GlobalStoreProvider>
  );
}
