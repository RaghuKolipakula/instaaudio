from crewai import Agent, Task, Crew, LLM
import os

from dotenv import load_dotenv
load_dotenv()

llm = LLM(
    model="gemini/gemini-pro-latest",
    api_key=os.environ.get("GEMINI_API_KEY")
)

agent = Agent(role="test", goal="say hello", backstory="you are a polite bot", llm=llm)
task = Task(description="say hello world", expected_output="a greeting", agent=agent)
crew = Crew(agents=[agent], tasks=[task])
res = crew.kickoff()
print("Execution success!")
print(res)
