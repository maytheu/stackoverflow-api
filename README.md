# Scrap data from StackOverflow.com

## Endpoints
/tags returns the tags page based on page and tab which are optional parameter
The default behaviour of this end point returns the newest tab and first page

/tag_question/{tag} /returns the question based on the tags based on page, pagesize and tab which are optional parameter
The default behaviour of this end point returns the newest tab, first page and 15 question

/question?{questioncode}&{question} returns the question details, it accepts questioncode and the question text as required parameter