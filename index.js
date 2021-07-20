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
  let { tab, page, pagesize } = req.query;

  if (!tab) tab = "newest";
  if (!page) page = 1;
  if (!pagesize) pagesize = 15;

  if (!tags) return res.json("Enter tag name to proceed");

  const response = await got(
    `${root}/questions/tagged/${tags}?tab=${tab}&page=${page}&pagesize=${pagesize}`
  );
  const dom = new JSDOM(response.body);

  const nodeListQuestion = [...dom.window.document.querySelectorAll("a")];
  const nodeListExcerpt = [...dom.window.document.querySelectorAll("div")];
  const nodeListVotes = [...dom.window.document.querySelectorAll("span")];
  const nodeListViews = [...dom.window.document.querySelectorAll("div")];
  const nodeListAnswer = [...dom.window.document.querySelectorAll("div")];

  // filter both question and tag
  const questions = nodeListQuestion
    .filter((link) => link.href.includes("/questions"))
    .map((link) => link.href)
    .filter((tag) => !tag.includes("https"))
    .filter((tag) => !tag.includes("?tab"))
    .filter((tag) => !tag.includes("tagged"))
    .filter((tag) => !tag.includes("%20"))
    .filter((tag) => !tag.includes("/ask"));
  const question = [...new Set(questions)];
  question.shift();
  const questionObject = question.map((tag) => {
    let tags = tag.split(/[\/]/);
    let question, questionCode;
    if (tags.length === 4) {
      if (/^[0-9]+$/.test(tags[2])) {
        questionCode = tags[2];
        question = tags[3];
      }
      if (tags.includes("tagged")) tagged = tags[3];

      return { questionCode, question };
    }
  });

  // filter excerpts
  const excerpts = nodeListExcerpt
    .filter((div) => div.className.includes("excerpt"))
    .map((div) => div.innerHTML);

  // filter  question vote
  const votes = nodeListVotes
    .filter((span) => span.className.includes("vote-count-post "))
    .map((span) => {
      let vote = span.innerHTML;
      let voteCount = vote.replace(/^\D+/g, "");
      return voteCount[0];
    });

  // show views
  const views = nodeListViews
    .filter((div) => div.className.includes("views"))
    .map((div) => div.innerHTML);

  // show answer
  const answers = nodeListAnswer
    .filter((div) => div.className.includes("answered"))
    .map((div) => {
      let answer = div.innerHTML;
      let answerCount = answer.replace(/^\D+/g, "");
      return answerCount[0];
    });

  let taggedQuestions = [questionObject, excerpts, votes, views, answers];
  const taggedQuestionsLength = taggedQuestions[0].length;

  let format = [];
  // merge the whole array and convert to object
  for (let j = 0; j < taggedQuestionsLength; j++) {
    for (let i = 0; i < 1; i++) {
      format.push({
        question: taggedQuestions[0][j],
        excerpt: taggedQuestions[1][j],
        votes: taggedQuestions[2][j],
        view: taggedQuestions[3][j],
        answer: taggedQuestions[4][j],
      });
    }
  }

  res.json(format);
});

// view question
app.get("/question", async (req, res) => {
  const { questioncode, question } = req.query;

  if (!questioncode && !question) return res.json("404, not found");

  const response = await got(`${root}/questions/${questioncode}/${question}`);
  const dom = new JSDOM(response.body);

  const nodeListTitle = [...dom.window.document.querySelectorAll("h1")];
  const nodeListAsk = [...dom.window.document.querySelectorAll("time")];
  const nodeListlastActive = [...dom.window.document.querySelectorAll("a")];
  const nodeListView = [...dom.window.document.querySelectorAll("div")];
  const nodeListVote = [...dom.window.document.querySelectorAll("div")];
  const nodeListTags = [...dom.window.document.querySelectorAll("a")];
  const nodeListQuestion = [...dom.window.document.querySelectorAll("div")];

  const title = nodeListTitle
    .filter((h1) => h1.className.includes("fs"))
    .map((a) => {
      let title = a.innerHTML.split(/[<>]/);
      return title[2];
    });

  const ask = nodeListAsk
    .filter((time) => time.dateTime.includes("T"))
    .map((time) => {
      let ask = time.innerHTML;
      return ask;
    });

  const lastActive = nodeListlastActive
    .filter((link) => link.href.includes("?lastactivity"))
    .map((link) => link.innerHTML);

  const view = nodeListView
    .filter((div) => div.title.includes("Viewed"))
    .map((div) => {
      let view = div.innerHTML.split(/[\n]/);
      return view[2];
    });

  const vote = nodeListVote
    .filter((div) => div.className.includes("js-vote-count"))
    .map((div) => {
      return div.innerHTML;
    });

  let questionVote = vote.shift();
  let answerVote = vote;

  const tags = nodeListTags
    .filter((link) => link.title.includes("tagged"))
    .map((link) => {
      let tag = link.innerHTML;
      return tag;
    });

  const halfArray = (tags) => {
    let tagLength = tags.length;
    let start = tagLength / 2 - 1;
    let end = tagLength - start - 1;
    tags.splice(start, end);
  };
  halfArray(tags);

  const questions = nodeListQuestion
    .filter((div) => div.className.includes("s-prose js-post-body"))
    .map((div) => div.innerHTML);
  let questionBody = questions.shift();
  let answerBody = questions;

  const answers = [answerBody, answerVote];
  const answerLength = answers[0].length;

  const ans = [];

  for (let j = 0; j < answerLength; j++) {
    for (let i = 0; i < 1; i++) {
      ans.push({ answer: answers[0][j], vote: answers[1][j] });
    }
  }

  return res.json({
    question: {
      title,
      asked: ask[0],
      active: lastActive[0],
      viewed: view[0],
      question: questionBody,
      vote: questionVote,
    },
    answer: ans,
  });
});


app.get("/search/:search", async (req, res) => {
  const { search } = req.params;

  console.log(`${root}/search?q=${search}`);

  const response = await got(`${root}/search?q=${search}`);
  var dom = new JSDOM(response.body);

  const nodeListCaptcha = [...dom.window.document.querySelectorAll("form")];
  const captcha = nodeListCaptcha
    .filter((form) => form.action.includes("/nocaptcha"))
    .map((form) => {
      let link = form.action.split(/[?]/);
      return link[1];
    });

  console.log(captcha);

  if (captcha.length > 0) {
    var resp = await got(`${root}/search?q=${search}&${captcha[0]}`);
    console.log(`${root}/search?q=${search}&${captcha[0]}`);
    dom = new JSDOM(resp.body);
  }

  const nodeListCaptchas = [...dom.window.document.querySelectorAll("form")];
  const captchas = nodeListCaptchas
    .filter((form) => form.action.includes("/nocaptcha"))
    .map((form) => {
      let link = form.action.split(/[?]/);
      return link[1];
    });
  console.log(captchas);

});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`server starting on ${port}`));
