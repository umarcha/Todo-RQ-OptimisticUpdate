import axios from "axios";
import AddTodo from "./components/AddTodo";
import TodoCard from "./components/TodoCard";
import { useQuery } from "@tanstack/react-query"

export interface Todo {
  title: string;
  status: boolean;
  _id: string;
}

const getTodo = () => {
  return axios.get("https://todo-backend.cyclic.app/get-todo")
    .then((res) => res?.data)
    .catch(err => console.log(err))
}

function App() {

  const { data, isLoading, isError } = useQuery({
    queryKey: ['todo'],
    queryFn: getTodo,
  })

  console.log(data);


  if (isLoading) {
    return <span>Loading...</span>
  }

  if (isError) {
    return <span>Error...</span>
  }

  return (
    <main className="max-w-4xl mx-auto px-5">
      <AddTodo />
      <div className="grid grid-cols-2 gap-4 mt-12 place-content-start h-[424px] overflow-y-auto p-2" id="scrollbar">
        {data?.todos.map((item: Todo, index: number) => <TodoCard key={index} item={item} />)}
      </div>
    </main>
  )
}

export default App
