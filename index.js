const express = require("express");
const got = require("got");
const jsdom = require("jsdom");

const app = express();
const { JSDOM } = jsdom;

const root = "https://stackoverflow.com";

const parse = (link) => {
  return link.href.includes("/questions/tagged");
};

app.get("/", (req, res) => {
  res.send("Welcome to Stackoverflow Api");
});

// get stackover tags
app.get("/tags", async (req, res) => {
  let { tab, page } = req.query;
  if (!tab) tab = "popular";

  if (!page) page = 1;

  const response = await got(`${root}/tags?page=${page}&tab=${tab}`);
  const dom = new JSDOM(response.body);

  const nodeList = [...dom.window.document.querySelectorAll("a")];

  const tag = nodeList
    .filter(parse)
    .map((link) => link.href)
    .filter((tag) => !tag.includes("sort"))
    .map((tag) => {
      let tags = tag.split(/[\/]/);
      if (/[\%]/.test(tags[3])) {
        let decodeTag = decodeURIComponent(tags[3]);
        tags.splice(3, 0, decodeTag);
      }

      return tags[3];
    });
  res.json({ tags: tag });
});

// get questions based on tags
app.get("/tag_question/:tags", async (req, res) => {
  const { tags } = req.params;
  let { tab, page, page_size } = req.query;
  if (!tab) tab = "newest";

  if (!page) page = 1;

  if (!page_size) page_size = 15;

  if (!tags) return res.json("Enter tag name to proceed");

  const response = await got(
    `${root}/questions/tagged/${tags}?tab=${tab}&page=${page}&pagesize=${page_size}`
  );
  const dom = new JSDOM(response.body);

  const nodeListQuestion = [...dom.window.document.querySelectorAll("a")];
  const nodeListExcerpt = [...dom.window.document.querySelectorAll("div")];
  const nodeListVotes = [...dom.window.document.querySelectorAll("span")];
  const nodeListViews = [...dom.window.document.querySelectorAll("div")];
  const nodeListAnswer = [...dom.window.document.querySelectorAll("div")];

  const questions = nodeListQuestion
    .filter((link) => link.href.includes("/questions"))
    .map((link) => link.href)
    .filter((tag) => !tag.includes("https"))
    .filter((tag) => !tag.includes("?tab"))
    .filter((tag) => !tag.includes("+"))
    // .filter((tag) => tag.indexOf(/^\d+/g)===1)
    .map((tag) => {
      console.log(tag);

      let tags = tag.split(/[\/]/);
      let question, questionCode, tagged;
      if (tags.length === 4) {
        if (/^[0-9]+$/.test(tags[2])) {
          questionCode = tags[2];
          question = tags[3];
        }
        if (tags.includes("tagged")) tagged = tags[3];

        return { questionCode, question, tagged };
      }
    });

  const excerpts = nodeListExcerpt
    .filter((div) => div.className.includes("excerpt"))
    .map((div) => div.innerHTML);

  const votes = nodeListVotes
    .filter((span) => span.className.includes("vote-count-post "))
    .map((span) => {
      let vote = span.innerHTML;
      let voteCount = vote.replace(/^\D+/g, "");
      return voteCount[0];
    });

  const views = nodeListViews
    .filter((div) => div.className.includes("views"))
    .map((div) => div.innerHTML);

  const answers = nodeListAnswer
    .filter((div) => div.className.includes("answered"))
    .map((div) => {
      let answer = div.innerHTML;
      let answerCount = answer.replace(/^\D+/g, "");
      return answerCount[0];
    });

  const questionObject = [];
  for (let question of questions) {
    // console.log(question);
  }

  let taggedQuestions = [questions, excerpts, votes, views, answers];

  console.log(taggedQuestions instanceof Array);
  console.log(questions instanceof Array);
  // taggedQuestions.map

  const taggedObject = taggedQuestions.map((tag, i) => {
    // console.log(tag[0])
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`server starting on ${port}`));
