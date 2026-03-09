from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import sys
import contextlib

class MCPHost:
    def __init__(self):
        self.sessions = {}
        self._contexts = {}
    
    @contextlib.asynccontextmanager
    async def connect_to_server(self, server_name: str, command: str, args: list[str]):
        """
        Connects to an MCP Server using standard I/O.
        """
        server_params = StdioServerParameters(
            command=command,
            args=args,
            env=None
        )
        
        # We need to maintain the context
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                self.sessions[server_name] = session
                
                print(f"[{server_name}] MCP Server Initialized.")
                
                # Yield the session so it can be used within context
                yield session

    def get_session(self, server_name: str) -> ClientSession:
        if server_name not in self.sessions:
            raise ValueError(f"Session {server_name} not found.")
        return self.sessions[server_name]

# Helper singleton or factory 
mcp_host = MCPHost()
