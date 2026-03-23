use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct MarkdownBlock {
    pub id: String,
    pub block_type: String,
    pub content: String,
    pub metadata: Option<serde_json::Value>,
}

pub fn parse_markdown_to_blocks(markdown: &str) -> Vec<MarkdownBlock> {
    // A simple block-based parser using double-newlines.
    markdown
        .split("\n\n")
        .enumerate()
        .filter(|(_, content)| !content.trim().is_empty())
        .map(|(i, content)| {
            let content = content.trim();
            let block_type = if content.starts_with("#") {
                "heading".to_string()
            } else if content.starts_with("- ") || content.starts_with("* ") {
                "list".to_string()
            } else if content.starts_with(">") {
                "quote".to_string()
            } else if content.starts_with("$$") && content.ends_with("$$") {
                "latex".to_string()
            } else {
                "paragraph".to_string()
            };

            MarkdownBlock {
                id: format!("block-{}", i),
                block_type,
                content: content.to_string(),
                metadata: None,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_markdown_to_blocks() {
        let md = "# Title\n\n- Item 1\n- Item 2\n\nSome text.\n\n$$\\sum_{i=0}^n i^2$$";
        let blocks = parse_markdown_to_blocks(md);
        
        assert_eq!(blocks.len(), 4);
        assert_eq!(blocks[0].block_type, "heading");
        assert_eq!(blocks[1].block_type, "list");
        assert_eq!(blocks[2].block_type, "paragraph");
        assert_eq!(blocks[3].block_type, "latex");
    }
}
