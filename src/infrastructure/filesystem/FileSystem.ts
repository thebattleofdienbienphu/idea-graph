export class FileSystem {
  public async readFile(path: string): Promise<string> {
    const content = localStorage.getItem(path);
    if (content === null) {
      throw new Error(`File not found at path: ${path}`);
    }
    return content;
  }

  public async writeFile(path: string, content: string): Promise<void> {
    localStorage.setItem(path, content);
  }
}
