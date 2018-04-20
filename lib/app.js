// Create angular app.
var app = angular.module("xqrApp", ["ngRoute"]);

// Keys for local storage.
app.visited_key = 'xqrVisited';
app.quiz_key = 'xqrQuiz';
app.current_key = 'xqrCurrent';

// JSON filenames.
app.quests_json = './data/quests.json';
app.stages_json = './data/stages.json';

// Returns list visited stages.
app.getVisited = function() {
  if (localStorage.getItem(app.visited_key)) {
    return JSON.parse(localStorage.getItem(app.visited_key));
  }
  return [];
}

// Set visited stages.
app.setVisited = function(stageId) {
  localStorage.setItem(app.visited_key, JSON.stringify(stageId));
}

// Returns list visited stages.
app.getQuizState = function(questId, stageId) {
  if (localStorage.getItem(app.quiz_key)) {
    return JSON.parse(localStorage.getItem(app.quiz_key));
  }
  return {};
}

// Set visited stages.
app.setQuizState = function(questId, stageId, state) {
  quiz = app.getQuizState(questId, stageId);
  quiz[questId + "_" + stageId] = state;
  localStorage.setItem(app.quiz_key, JSON.stringify(quiz));
}

// Returns current quest id or FALSE if not set.
app.getCurrentQuest = function() {
  if (localStorage.getItem(app.current_key)) {
    return localStorage.getItem(app.current_key);
  }
  return false;
}

// Returns current quest id or undefined if not set.
app.setCurrentQuest = function(questId) {
  return localStorage.setItem(app.current_key, questId);
}

// Set header title and slogan text.
app.setHeaderText = function(title, slogan) {
  document.getElementById('header-primary').innerHTML = title;
  document.getElementById('header-secondary').innerHTML = slogan;
}

// Set header background image if available, else keeps current background.
app.setHeaderImage = function(filename) {
  var header = document.getElementById('header');
  if (filename) {
    // Apply background image.
    header.style.background = "url('./assets/" + filename + "') center center";
    // Add text shadow for better contrast.
    header.style.textShadow = "1px 1px 2px black, 0 0 1em black, 0 0 0.2em black";
  }
}

// Setup routing
app.config(function($routeProvider) {
  $routeProvider
  .when("/", {
    templateUrl: "lib/main.htm",
    controller: "RootController"
  })
  .when("/access/:code", {
    template: "", // no template, redirect site
    controller: "AccessController"
  })
  .when("/:quest", {
    templateUrl : "lib/quest.htm",
    controller: "QuestController"
  })
  .when("/:quest/:stage", {
    templateUrl : "lib/stage.htm",
    controller: "StageController"
  })
  .otherwise({
    redirectTo: '/'
  });
});

app.controller('RootController', function($scope, $http) {

  $scope.quests = [];

  $http.get(app.quests_json).then(function(response) {
    var quests = response.data;
    for (var i in quests) {
      $scope.quests.push(quests[i]);
    }

    document.title = "Join the Quest!";
    app.setHeaderText(document.title, "Wellcome to the quest!")
  });

});

app.controller('QuestController', function($scope, $http, $routeParams) {

  $scope.quest = null;

  $http.get(app.quests_json).then(function(response) {
    var quests = response.data;
    for (var i in quests) {
      if (quests[i].id == $routeParams.quest) {
        $scope.quest = quests[i];
        var visited = app.getVisited()
        for (var j in $scope.quest.stages) {
          var stage = $scope.quest.stages[j];
          stage.visible = (visited.indexOf(stage.stage) >= 0);
        }
        break;
      }
    }

    if (null == $scope.quest) {
      app.redirect();
      window.location = "#!"; // redirect to root
      return;
    }

    // Store this quest as default quest.
    app.setCurrentQuest($scope.quest.id);

    document.title = $scope.quest.title;
    app.setHeaderText(document.title, "Quest " + $scope.quest.title)
    app.setHeaderImage($scope.quest.image)
  });

});

app.controller('StageController', function($scope, $http, $routeParams) {

  $scope.quest = null;
  $scope.stage = null;

  $http.get(app.quests_json).then(function(response) {
    var quests = response.data;
    for (var i in quests) {
      if (quests[i].id == $routeParams.quest) {
        $scope.quest = quests[i];
        break;
      }
    }

    if (null == $scope.quest) {
      window.location = "#!"; // redirect to root
      return;
    }

    // Store this quest as default quest.
  app.setCurrentQuest($scope.quest.id);

    var stages = $scope.quest.stages;
    for (var i in stages) {
      if (stages[i].id == $routeParams.stage) {
        $scope.stage = stages[i];
        var quizState = app.getQuizState($scope.quest.id, $scope.stage.id);
        if ($scope.stage.quiz) {
          $scope.stage.quiz.solved = quizState;

        }
        break;
      }
    }

    if (null == $scope.stage) {
      window.location = "#!" + $routeParams.quest; // redirect to quest
      return;
    }

    // Stage was never visited before, access denied!
    if (-1 == app.getVisited().indexOf($scope.stage.stage)) {
      window.location = "#!" + $routeParams.quest; // redirect to quest
      return;
    }

    $scope.buttonColor = function(answer) {
      return answer.valid ? 'red' : 'green';
    }
    $scope.chooseAnswer = function(answer) {
      app.setQuizState($scope.quest.id, $scope.stage.id, answer.valid)
    }

    document.title = $scope.stage.title + " - " + $scope.quest.title;
    app.setHeaderText($scope.stage.title, "Quest " + $scope.quest.title);
    if ($scope.stage.image) {
      app.setHeaderImage($scope.stage.image);
    } else {
      app.setHeaderImage($scope.quest.image);
    }
  });

});

app.controller('AccessController', function($scope, $http, $routeParams) {

  $http.get(app.stages_json).then(function(response) {
    var code = response.data[$routeParams.code];

    // Return to root on error.
    if (!code) {
      window.location = "#!";
      return;
    }

    // Update visited stages.
    var visited = app.getVisited()
    if (0 > visited.indexOf(code.stage)) {
      visited.push(code.stage);
    }
    app.setVisited(visited);

    var currentQuest = app.getCurrentQuest();

    // Return to root if no quest is selected.
    if (!currentQuest) {
      window.location = "#!";
      return;
    }

    $http.get(app.quests_json).then(function(response) {
      var quests = response.data;
      for (i = 0; i < quests.length; ++i) {
        if (quests[i].id == currentQuest) {
          var quest = quests[i];
          var stages = quest.stages;
          for (j = 0; j < stages.length; ++j) {
            var stage = stages[j];
            if (stage.stage == code.stage) {
              window.location = "#!" + quest.id + "/" + stage.id;
              return;
            }
          }
        }
      }
      window.location = "#!" + currentQuest;
      return;
    });

  });

});
