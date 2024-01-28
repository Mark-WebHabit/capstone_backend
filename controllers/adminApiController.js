import asyncHandler from "express-async-handler";
import { Lawns } from "../models/Lawns.js";
import { Plots } from "../models/Plots.js";
import { Users } from "../models/Users.js";
import { Deceaseds } from "../models/Deceased.js";
import naturalSort from "natural-sort";

export const getAreasAdmin = asyncHandler(async (req, res) => {
  const lawns = await Lawns.find().lean(); // do this to other area types not just lawns

  if (!lawns || !lawns.length) {
    return res.status(400).json({ error: "Couldn't get the areas" });
  }

  // if there are other area type aside from lawn just merge them, only their name is crucial for this endpoint
  // when there is other area type mutate the data to e returbed to mactehed all te names, forexample if there is lawnName and nicheName merge the aray and make it areaName
  return res.json({ data: lawns });
});

export const getTableInfo = asyncHandler(async (req, res) => {
  const { areaId } = req.params;
  const { page } = req.query;
  const status = req.query.status;

  let plots;
  let start;
  let end;

  if (page) {
    start = (parseInt(page) - 1) * 10;
    end = parseInt(page) * 10;
  }

  if (!areaId) {
    return res
      .status(400)
      .json({ error: "Invalid Parameter: No Area Selected" });
  }

  const selectedArea = await Lawns.findOne({ _id: areaId }); // the area id could aslo pertain to other type aside from lawn so if there are any other type available from the db do the samething

  if (!selectedArea) {
    return res.status(404).json({ error: "No Area Matched The Given Area" });
  }
  await Plots.createIndexes({ plotName: 1, plotStatus: 1 });

  if (status && status !== "All") {
    plots = await Plots.find({
      $and: [
        { structureId: { $eq: selectedArea._id } },
        { status: { $eq: status } },
      ],
    });
  } else {
    plots = await Plots.find({
      structureId: selectedArea._id,
    }).lean();
  }

  const plotsLength = plots.length;

  plots = plots.sort((a, b) => naturalSort()(a.plotName, b.plotName));

  if (page) {
    plots = plots.slice(start, end);
  }

  const areaName = selectedArea.lawnName; // it can be other type of area so i'm assigning it in a variable to conditionally set it

  if (!plots || !plots.length) {
    return res.status(404).json({ error: `No Plots Found in ${areaName}` });
  }

  let data = [];
  for (const plot of plots) {
    let info = { plotName: plot.plotName, plotId: plot._id };

    if (plot.structureId.equals(selectedArea._id)) {
      if (plot.status === "withInterment") {
        const deceased = await Deceaseds.findOne({ plotId: plot._id }).lean();

        if (!deceased) {
          return res.status(500).json({
            error: "There was an error fetching data, please refresh the page",
          });
        }
        let name;
        if (deceased?.middleName) {
          name =
            deceased.name + " " + deceased.middleName + " " + deceased.lastName;
        } else {
          name = deceased.name + " " + deceased.lastName;
        }
        if (deceased?.suffix) {
          name =
            deceased.name +
            " " +
            deceased.middleName +
            " " +
            deceased.lastName +
            " " +
            deceased.suffix;
        }
        info = {
          ...info,
          plotStatus: "With Interment",
          deceasedId: deceased._id,
          deceasedName: name,
          deceasedContact: deceased.phone,
          deceasedBornDate: deceased.birthDate,
          deceasedDeathDate: deceased.deathDate,
          rawName: deceased.name,
          rawLastName: deceased.lastName,
          rawMiddleName: deceased?.middleName || null,
          rawSuffix: deceased?.suffix || null,
          deceasedAge: deceased.age,
        };
      } else {
        info = { ...info, plotStatus: plot.status };
      }
    }

    data.push(info);
  }

  return res.json({
    data: data,
    length: plotsLength,
    area: selectedArea.lawnName,
  });
});

export const searchDeceaseds = asyncHandler(async (req, res) => {
  const { query } = req.params;
  const { page } = req.query;

  let search;
  let start;
  let end;

  if (page) {
    start = (parseInt(page) - 1) * 10;
    end = parseInt(page) * 10;
  }

  const searchFilter = {
    $or: [
      {
        name: {
          $regex: new RegExp(query.toString(), "i"),
        },
      },
      {
        middleName: {
          $regex: new RegExp(query.toString(), "i"),
        },
      },
      {
        lastName: {
          $regex: new RegExp(query.toString(), "i"),
        },
      },
    ],
  };

  await Deceaseds.createIndexes({ plotId: 1 });

  search = await Deceaseds.find(searchFilter).lean();

  if (!search) {
    return res.json({ data: [], length: 0 });
  }

  let result = [];
  let area;

  for (const data of search) {
    const plot = await Plots.findOne({ _id: data.plotId }).lean();
    if (plot) {
      area = await Lawns.findOne({ _id: plot.structureId }).exec(); // do this to any other type of area
    }
    let info = {};

    if (!plot) {
      return res
        .status(500)
        .json({ error: "Some data doesn't matched the result" });
    }

    area = { areaName: area?.lawnName, _id: area._id };

    info = { plotName: plot.plotName, plotId: plot._id, area: area || null };

    let name;
    if (data?.middleName) {
      name = data.name + " " + data.middleName + " " + data.lastName;
    } else {
      name = data.name + " " + data.lastName;
    }
    if (data?.suffix) {
      name =
        data.name +
        " " +
        data.middleName +
        " " +
        data.lastName +
        " " +
        data.suffix;
    }
    info = {
      ...info,
      plotStatus: "With Interment",
      deceasedId: data._id,
      deceasedName: name,
      deceasedContact: data.phone,
      deceasedBornDate: data.birthDate,
      deceasedDeathDate: data.deathDate,
    };

    result.push(info);
  }

  result = result.sort((a, b) => naturalSort()(a.plotName, b.plotName));

  if (page) {
    result = result.slice(start, end);
  }

  return res.json({ data: result, length: search.length });
});

export const updateNotWithIntermentStatus = asyncHandler(async (req, res) => {
  const { id, value } = req.body;
  const acceptedValue = ["owned", "reserve", "saleable"];

  if (!id || !value) {
    return res
      .status(400)
      .json({ error: "Invalid Argumnets: Missing Some Parameter" });
  }

  if (!acceptedValue.includes(value)) {
    return res.status(400).json({ error: `Invalid Value: ${value}` });
  }

  const plot = await Plots.findOne({ _id: id }).lean();

  if (!plot) {
    return res.status(500).json({
      error: "There was an error updating the plot: PLease refresh the page",
    });
  }

  if (plot.status === value) {
    return res.json({ data: true });
  }

  if (plot.status == "withInterment" && value !== "withInterment") {
    //delete the corresponding document
    const deleteDeceased = await Deceaseds.findOneAndDelete({
      plotId: plot._id,
    });
    if (!deleteDeceased) {
      return res
        .status(500)
        .json({ error: "Something went wrong: Please restart the page" });
    }
  }

  const updatedPlot = await Plots.findOneAndUpdate(
    { _id: plot._id },
    { status: value },
    { new: true }
  );

  if (updatedPlot) {
    return res.json({ data: updatedPlot });
  }
  return res
    .status(500)
    .json({ error: "Something went wrong: Please restart the page" });
});

export const updateInterment = asyncHandler(async (req, res) => {
  const {
    plotId,
    status,
    name,
    middleName,
    lastName,
    suffix,
    age,
    birthDate,
    deathDate,
    contact,
  } = req.body;

  if (
    !plotId ||
    !status ||
    !name ||
    !lastName ||
    !birthDate ||
    !deathDate ||
    !contact
  ) {
    return res
      .status(400)
      .json({ error: "Invalid Parameter: Provide All Required Fields" });
  }
  const plot = await Plots.findOneAndUpdate(
    { _id: plotId },
    { status },
    { new: false }
  ).lean();

  if (!plot) {
    return res
      .status(404)
      .json({ error: "Cannot find Plot with ID: " + plotId });
  }

  const deceasedInfo = {
    plotId: plot._id,
    name,
    middleName,
    lastName,
    age: parseInt(age),
    birthDate,
    deathDate,
    phone: contact,
    suffix,
  };
  let result;
  if (plot.status == "withInterment") {
    const deceased = await Deceaseds.findOne({ plotId: plot._id });
    result = await Deceaseds.findByIdAndUpdate(
      { _id: deceased._id },
      { $set: deceasedInfo },
      { new: true }
    ).lean();
  } else {
    const newDoc = new Deceaseds(deceasedInfo);
    result = await newDoc.save();
  }

  if (!result) {
    return res
      .status(500)
      .json({ error: "Update Did Not Save: Please Restart And Retry" });
  }
  return res.json({ data: result });
});

export const getPersonnel = asyncHandler(async (req, res) => {
  const users = await Users.find({ role: { $not: { $eq: "guest" } } }).exec();

  if (users && users.length) {
    return res.json({ data: users });
  }
  return res.json({ data: [] });
});

export const searchForGuests = asyncHandler(async (req, res) => {
  const query = req.params.query;

  if (!query)
    return res
      .status(400)
      .json({ error: "Invalid Parameter: User Input Required" });

  const searchFilter = {
    $or: [
      {
        username: {
          $regex: new RegExp(query.toString(), "i"),
        },
      },
      {
        email: {
          $regex: new RegExp(query.toString(), "i"),
        },
      },
    ],
    verified: true,
    role: "guest",
  };

  const response = await Users.find(searchFilter).lean();

  if (!response) return res.json({ data: [] });

  return res.json({ data: response });
});

export const updateGuestAsEmployee = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id)
    return res
      .status(404)
      .json({ error: "Cannot Update User With Unknown Id" });

  const matchedUser = await Users.findOne({
    $and: [{ _id: id }, { role: "guest" }],
  });

  if (!matchedUser || !matchedUser?._id) {
    if (!id)
      return res
        .status(404)
        .json({ error: "Cannot Update User With Unknown Id" });
  }

  if (matchedUser.role !== "guest")
    return res
      .status(400)
      .json({ error: "Only Guest User Can Be Promote Status As Employee" });

  const updatedUser = await Users.findOneAndUpdate(
    { _id: matchedUser._id },
    { role: "employee" },
    { new: true }
  );

  if (!updatedUser)
    return res.status(400).json({
      error: "Cannot Update This User, Refresh The Page And Try Again",
    });

  return res.json({ data: updatedUser });
});

export const assignRole = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const role = req.body.role;
  if (!id)
    return res.status(404).json({ error: "Cannot Update User With Unknow ID" });
  if (!role)
    return res
      .status(400)
      .json({ error: "Invalid Parameter: Provide A Role To Assign" });

  const user = await Users.findOne({ _id: id }).exec();

  if (!user)
    return res.status(404).json({ error: "Cannot Update Unknown User" });

  if (role.toLowerCase() == user.role.toLowerCase()) {
    return res
      .status(400)
      .json({ error: "The Specified User Already Has The Defined Role" });
  }

  const updatedUser = await Users.findOneAndUpdate(
    { _id: id },
    { role: role.toLowerCase() },
    { new: true }
  );

  if (!updatedUser)
    return res
      .status(400)
      .json({
        error: "Failed To Assign Role: Refresh The Ppage And Try Again",
      });

  return res.json({ data: updatedUser });
});
