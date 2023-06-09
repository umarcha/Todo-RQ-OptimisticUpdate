import { useState } from 'react'
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

export interface AddTodoIF {
  title: string,
  status: boolean
  _id: number | string
}

export interface TodoIF {
  todos: AddTodoIF[]
}

const addTodo = (text: string) => axios.post("https://todo-backend.cyclic.app/add-todo", { title: text, status: false });

const AddTodo = () => {

  const queryClient = useQueryClient()

  const [todo, setTodo] = useState("");

  // Optimistic Update Mutations
  const mutation = useMutation({
    mutationFn: addTodo,
    // When Mute is called
    onMutate: async (text: string) => {
      setTodo("")

      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      queryClient.cancelQueries({ queryKey: ["todo"] })

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData<TodoIF>(['todo'])

      // Optimistically update to the new value
      if (previousTodos) {
        console.log("Inside previousTodos", previousTodos.todos);

        queryClient.setQueryData<TodoIF>(["todo"], {
          ...previousTodos,
          todos: [
            ...previousTodos.todos,
            { title: text, status: false, _id: "temp" }
          ]
        })
      }
      return { previousTodos }
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (context: { previousTodos?: TodoIF | undefined }) => {
      if (context?.previousTodos) {
        queryClient.setQueryData<TodoIF>(["todo"], context?.previousTodos)
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todo"] })
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()

    mutation.mutate(todo)
  }


  return (
    <div className="px-6 py-8 shadow-lg rounded-xl w-full max-w-md mx-auto mt-8">
      <form onSubmit={handleSubmit}>
        <input type="text" className="block outline-none border border-gray-400 rounded h-9 w-full px-2"
          onChange={(e) => setTodo(e.target.value)}
          required
          value={todo}
        />
        <button type="submit" className="mt-4 px-4 py-2 block mx-auto w-fit rounded font-semibold text-base leading-5 text-white bg-teal-600">
          {/* {mutation.isLoading ? " Loading..." : "Add Todo"} */}
          Add Todo
        </button>
      </form>
    </div>
  )
}

export default AddTodo
