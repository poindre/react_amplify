import React, { useState, useEffect } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { CreateTodoInput } from "./API";
import { listTodos } from "./graphql/queries";
import { createTodo } from "./graphql/mutations";
import { onCreateTodo } from "./graphql/subscriptions";

interface Todo {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

type ListTodosQuery = {
  listTodos?: {
    items: Array<Todo>;
    nextToken?: string | null;
  } | null;
};

type OnPostMessageSubscriptionEvent = {
  value: { data: { onCreateTodo: Todo } };
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");

  const getTodos = async () => {
    try {
      const result = await API.graphql(graphqlOperation(listTodos));
      console.log("todos: ", result);
      const data = result.data as ListTodosQuery;

      if (!data.listTodos) return;

      const todoList: Todo[] = data.listTodos.items.map((todo) => todo);
      console.log([...todos, ...data.listTodos.items]);
      setTodos(todoList);
    } catch (e) {
      console.log(e);
    }
  };

  const onChangeTodo = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewTodo(event.target.value);
  };

  const onChangeDescription = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewDescription(event.target.value);
  };

  const onSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log(newTodo, newDescription);
    if (newTodo === "" || newDescription === "") return;
    event.preventDefault();

    const createTodoInput: CreateTodoInput = {
      name: newTodo,
      description: newDescription,
    };

    // 登録処理
    try {
      await API.graphql(
        graphqlOperation(createTodo, { input: createTodoInput })
      );
      console.log("createTodoInput: ", createTodoInput);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getTodos();

    API.graphql(graphqlOperation(onCreateTodo)).subscribe({
      next: (eventData: OnPostMessageSubscriptionEvent) => {
        console.log("eventData: ", eventData);
        const todo = eventData.value.data.onCreateTodo;
        setTodos((prevTodos) => [...prevTodos, todo]);
        // const posts = [
        //   ...this.state.posts.filter((content) => {
        //     return content.title !== post.title;
        //   }),
        //   post,
        // ];
      },
    });
  }, []);

  return (
    <div className="App">
      <p>タイトル</p>
      <input type="text" onChange={onChangeTodo} value={newTodo} />
      <p>内容</p>
      <input
        type="text"
        onChange={onChangeDescription}
        value={newDescription}
      />
      <p>
        <button onClick={onSubmit}>送信</button>
      </p>

      <ul>
        {todos
          ? todos.map((item, index) => (
              <li key={index}>
                {item.name}: {item.description}
              </li>
            ))
          : ""}
      </ul>
    </div>
  );
}

export default App;
