import { makeId } from "~/shared/utils/id";
import type { Route } from "./+types/home";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import useIniter from "~/modules/board/hooks/init";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

const BoardInit = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const { init } = useIniter(id);
  useEffect(() => {
    init();
    setTimeout(() => {
      navigate(`/board/${id}`);
    }, 100);
  }, []);
  return <></>;
};

export default function Home() {
  const id = makeId(10);
  return <BoardInit id={id} />;
}
