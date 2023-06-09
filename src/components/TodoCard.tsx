import { Todo } from "../App";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { TodoIF } from "./AddTodo";

interface TodoCardProps {
  item: Todo;
}

interface StatusIF {
  id: string,
  status: boolean
}


const deleteTodo = (id: string) => axios.delete(`https://todo-backend.cyclic.app/delete/${id}`)
const changeStatus = (data: StatusIF) => axios.patch(`https://todo-backend.cyclic.app/update/${data.id}`, { status: data.status })

const TodoCard = ({ item }: TodoCardProps) => {

  const queryClient = useQueryClient();

  // Handle UpdateStatus Mutation When user click on checkbox
  const statusMutation = useMutation({
    mutationFn: changeStatus,

    //execute when mute is called
    onMutate: async (data: StatusIF) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['todo', data.id] })

      // Snapshot the previous value
      const previousTodo = queryClient.getQueryData(['todo', data.id])

      // Optimistically update to the new value
      queryClient.setQueryData(['todo', data.id], data)

      // Return a context with the previous and new todo
      return { previousTodo, data }
    },

    // If the mutation fails, use the context we returned above
    onError: (context: { previousTodos?: TodoIF | undefined }) => {
      queryClient.setQueryData<TodoIF>(['todo'], context.previousTodos);
    },

    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todo'] });
    },
  })

  // Update the Status When user click on checkbox
  const updateStatus = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const status = e.target.checked;
    statusMutation.mutate({ id: item._id, status: status })
  }

  // Handle Delete Mutation to Update Optimistic Updates 
  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todo'] });

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData<TodoIF>(['todo']);

      // Find the index of the todo to be deleted
      const todoIndex = previousTodos?.todos.findIndex(todo => todo._id === id);

      // Optimistically remove the todo from the array
      let updatedTodos: TodoIF;
      if (typeof todoIndex === "number" && typeof previousTodos !== "undefined") {
        updatedTodos = {
          todos: [
            ...previousTodos.todos.slice(0, todoIndex),
            ...previousTodos.todos.slice(todoIndex + 1)
          ]
        }
        queryClient.setQueryData<TodoIF>(['todo'], updatedTodos);
      }

      // Return a context object with the snapshotted value
      return { previousTodos };
    },

    // If the mutation fails, use the context we returned above
    onError: (context: { previousTodos?: TodoIF | undefined }) => {
      queryClient.setQueryData<TodoIF>(['todo'], context.previousTodos);
    },

    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todo'] });
    },
  });

  // Delete the TodoCard when user click on Delete_Button
  const handleDelete = () => {
    deleteMutation.mutate(item._id)
  }

  return (
    <div className="px-4 py-6 rounded-md bg-white shadow-md">
      <div className="flex gap-3 justify-between items-center">
        <h5 className={`${item.status && 'line-through text-gray-400'}`}>{item.title}</h5>
        <input type="checkbox" checked={item.status}
          onChange={updateStatus}
        />
      </div>
      <div className="flex justify-center mt-4">
        <button
          onClick={handleDelete}
          className="bg-red-600 rounded-md px-3 py-2 text-xs text-white">
          {/* {deleteMutation.isLoading ? "Deleting" : "Delete"} */}
          Delete
        </button>
      </div>
    </div>
  )
}

export default TodoCard