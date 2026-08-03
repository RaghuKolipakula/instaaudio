import os
from crewai import Agent, Task, Crew, Process, LLM

# Optional: Import tools if you want Agent 2 to search the web for data
# from crewai_tools import SerperDevTool

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------
# Set your Gemini API key here or export it in your terminal (GEMINI_API_KEY)
os.environ["GEMINI_API_KEY"] = os.environ.get("GOOGLE_API_KEY", "your-google-api-key-here")
# os.environ["SERPER_API_KEY"] = os.environ.get("SERPER_API_KEY", "your-serper-api-key-here")

# Initialize the Gemini Model (Using Gemini 3.6 Flash to bypass 3.5 capacity issues)
gemini_llm = LLM(
    model="gemini/gemini-3.6-flash",
    temperature=0.7
)

# search_tool = SerperDevTool()

# --------------------------------------------------
# AGENTS
# --------------------------------------------------

# Agent 1: The Entrepreneur
entrepreneur = Agent(
    role='Visionary Niche Entrepreneur',
    goal='Find a razor-sharp, customer-focused niche business idea that solves a real problem.',
    backstory=(
        "You are a successful serial entrepreneur who excels at identifying "
        "hyper-specific problems and conceptualizing elegant, simple solutions. "
        "You focus on niche markets with desperate buyers who are willing to pay for a solution."
    ),
    verbose=True,
    allow_delegation=False,
    llm=gemini_llm
)

# Agent 2: The Critic
technical_critic = Agent(
    role='Data-Driven Technical Critic',
    goal='Validate the business idea using available data and ensure it can be built EXCLUSIVELY using Cloudflare tools.',
    backstory=(
        "You are a ruthless technical critic and data analyst. You destroy bad ideas with facts. "
        "You have a strict rule: the product must be buildable entirely within the Cloudflare ecosystem "
        "(e.g., Cloudflare Workers, KV, R2, D1, Pages) to keep infrastructure costs near zero. "
        "No AWS, no GCP, just Cloudflare."
    ),
    verbose=True,
    allow_delegation=True, # Allows this agent to push back and delegate to the Entrepreneur
    llm=gemini_llm
    # tools=[search_tool]  # Uncomment to allow Agent 2 to actually browse the web for market data
)

# Agent 3: The Anti-Marketing Gatekeeper
anti_marketing_estimator = Agent(
    role='Anti-Marketing Revenue Estimator',
    goal='Ensure the product sells itself without marketing, and estimate monthly revenue.',
    backstory=(
        "You despise marketing. You believe that if a product needs marketing, it's a flawed product. "
        "You demand viral, word-of-mouth, SEO-driven, or zero-CAC (Customer Acquisition Cost) growth loops. "
        "You are the final gatekeeper. If the idea requires paid ads or heavy marketing, you will reject it "
        "and demand a new one. Once an idea satisfies your strict criteria, you provide a realistic monthly revenue estimate."
    ),
    verbose=True,
    allow_delegation=True, # Crucial: Allows this agent to delegate back to Agent 1 to come up with a new idea
    llm=gemini_llm
)

# --------------------------------------------------
# TASKS
# --------------------------------------------------

# Task 1: Generate Idea
generate_idea_task = Task(
    description=(
        "Identify a hyper-niche, highly painful problem for a specific target audience and propose "
        "a software/SaaS solution for it. "
        "CRITICAL CONSTRAINTS: "
        "1. It must be extremely simple so a single developer can build the MVP in just a couple of hours. "
        "2. The ONLY operating cost must be a Cloudflare domain registration. It must comfortably sit "
        "entirely within Cloudflare's free tiers for hosting, compute, and database until it generates revenue. "
        "3. The product must sell automatically online. Customers must be actively searching for the exact solution online, "
        "and when they find it, they must be delighted to pay for it immediately (high-intent, zero-friction checkout). "
        "The creator must not have to do any manual sales or leave their desk. "
        "The solution should be simple but incredibly valuable."
    ),
    expected_output="A detailed pitch of a niche business idea, including the target audience, the exact problem, and the proposed solution.",
    agent=entrepreneur
)

# Task 2: Validate and Cloudflare-Check
validate_idea_task = Task(
    description=(
        "Critically evaluate the business idea proposed by the Entrepreneur. "
        "1. Check if there is actual logical demand based on standard market principles (or web search data if enabled). "
        "2. Detail exactly how the technical architecture can be built 100% on Cloudflare (e.g., Pages for frontend, "
        "Workers for backend logic, D1 for relational data, R2 for storage). "
        "3. STRICTLY VERIFY that it can actually be built in a couple of hours by one person and that it will cost absolutely $0 "
        "to run beyond a domain name (i.e. it fits perfectly within Cloudflare's free tiers). "
        "4. VERIFY that it is a completely automated digital sale targeting active search intent, requiring zero manual sales effort. "
        "If the idea is too complex, takes longer than a few hours to build, lacks clear demand, requires manual sales, or incurs any costs, "
        "use your delegation ability to reject it and ask the Entrepreneur for a simpler idea."
    ),
    expected_output="A validation report confirming market demand, exact Cloudflare free-tier architecture, and build-time estimation, or a clear rejection.",
    agent=technical_critic
)

# Task 3: No-Marketing Check and Revenue Estimation
evaluate_marketing_task = Task(
    description=(
        "Evaluate the validated, Cloudflare-based idea from the Technical Critic. "
        "Determine if it can acquire customers organically without active marketing (e.g., built-in product virality, "
        "B2B marketplace integrations, hyper-specific SEO). "
        "If it requires traditional marketing, delegate a task back to the Entrepreneur to pivot or come up with a completely new idea. "
        "If it passes the zero-marketing test, output the final approved business idea along with a detailed, realistic "
        "estimate of how much Monthly Recurring Revenue (MRR) it could generate in its first year, including the math behind the estimate."
    ),
    expected_output="The final approved business idea, an explanation of its organic growth loop, and a detailed MRR estimate.",
    agent=anti_marketing_estimator
)

# --------------------------------------------------
# CREW ASSEMBLY
# --------------------------------------------------

startup_crew = Crew(
    agents=[entrepreneur, technical_critic, anti_marketing_estimator],
    tasks=[generate_idea_task, validate_idea_task, evaluate_marketing_task],
    process=Process.sequential, # Sequential process, but allow_delegation=True lets them loop back to Agent 1 if needed
    verbose=True
)

if __name__ == "__main__":
    print("Starting the AI Startup Crew Workflow...")
    
    # Kick off the process
    result = startup_crew.kickoff()
    
    print("\n\n" + "="*50)
    print("🚀 FINAL APPROVED BUSINESS IDEA & REVENUE ESTIMATE 🚀")
    print("="*50 + "\n")
    print(result)
