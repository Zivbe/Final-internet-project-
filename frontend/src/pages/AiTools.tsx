import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { summarizeText } from "../api/ai";

export const AiToolsPage = () => {
  const { accessToken } = useAuth();
  const [text, setText] = useState("");
  const [result, setResult] = useState<{
    summary: string;
    tags: string[];
    category: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    setError(null);
    try {
      const data = await summarizeText(accessToken, text);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container">
      <h1>AI Tools</h1>
      <form onSubmit={handleSubmit} className="card stack">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste text to summarize..."
        />
        <button type="submit">Analyze</button>
      </form>
      {error ? <p>{error}</p> : null}
      {result ? (
        <div className="card stack">
          <h2>Summary</h2>
          <p>{result.summary}</p>
          <p>Category: {result.category}</p>
          <p>Tags: {result.tags.join(", ")}</p>
        </div>
      ) : null}
    </div>
  );
};
