
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB").then(() => {
  console.log("Connected Successfully to database");
});

// The name string here is actually the items in today list.
// And the name of the list is directly passed as "Today".
const itemsSchema = new mongoose.Schema({
  name: String
})

// The name string here is actually the name of the list(Title).
// "items" contains the items.
const listSchema = {
  name: String,
  items: [itemsSchema]
}

// This is a collection which contains one title and items.
const Item = mongoose.model("Item", itemsSchema);
// This is a collection which contains various title and each of them have its items.
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your to do list"
})

const item2 = new Item({
  name: "Hit the + button to add a new item"
})

const item3 = new Item({
  name: "<-- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  Item.find().then((result) => {
    if(result.length === 0) {
      Item.insertMany(defaultItems);
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: result});
    }
  })

});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then((result) => {
    if(result === null) {
      const list = new List({
        name: customListName,
        items: defaultItems
      })
      list.save();
      res.redirect("/" + customListName);
      console.log("reached");
    }
    else {
      // console.log(result);
      res.render("list", {listTitle: customListName, newListItems: result.items});
    }
  })
})

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: item
  })

  if(listName === "Today") {
    newItem.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}).then((result) => {
      result.items.push(newItem);
      result.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove({_id: checkedItemId}).then(() => {
      console.log("Deleted");
    });
    res.redirect("/");
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then((result) => {
      console.log("Deleted the checked item");
    })
    res.redirect("/" + listName);
  }
})

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
