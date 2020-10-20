"use strict";

var should = require("chai").should();
var qurascore = require("../");

describe('#versionGuard', function() {
  it('global._qurascore should be defined', function() {
    should.equal(global._qurascore, qurascore.version);
  });

  it('throw an error if version is already defined', function() {
    (function() {
      qurascore.versionGuard('version');
    }).should.throw('More than one instance of qurascore');
  });
});
