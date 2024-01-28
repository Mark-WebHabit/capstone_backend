import asyncHandler from "express-async-handler";
import { Plots } from "../models/Plots.js";
import { Deceaseds } from "../models/Deceased.js";
import { Lawns } from "../models/Lawns.js";

// @desc - Get All Plots
// private access
// endpoint - mapping/plots
export const getAllPlots = asyncHandler(async (req, res) => {
  const plots = await Plots.find();

  return res.status(200).json({ plots });
});

// @desc - Get All Plots
// private access
// endpoint - mapping/deceased
export const getAllDeceased = asyncHandler(async (req, res) => {
  const deceaseds = await Deceaseds.find();

  return res.status(200).json({ deceaseds });
});

// @desc - Get All Plots
// private access
// endpoint - mapping/lawns
export const getAllLawns = asyncHandler(async (req, res) => {
  const lawns = await Lawns.find();

  return res.status(200).json({ lawns });
});

// @desc - Get specific plot
// private access
// endpoint - mapping/lawns/:lawnName
export const getLawn = asyncHandler(async (req, res) => {
  const { lawnName } = req.params;

  if (!lawnName) {
    return res.status(400).json({ error: "Invalid Parameter" });
  }

  const lawn = await Lawns.findOne({ lawnName });

  if (!lawn) {
    return res.status(404).json({ error: `Lawn (${lawnName}) not found` });
  }

  return res.status(200).json({ lawn });
});

// @desc - search query
// endpoint - /mapping/search
// private access
export const searchDeceaseds = asyncHandler(async (req, res) => {
  const { query } = req.params;

  if (!query) {
    return res.status(401).json({ error: "Invalid Search Input" });
  }

  const result = [];

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
      {
        suffix: {
          $regex: new RegExp(query.toString(), "i"),
        },
      },
    ],
  };

  const searchResult = await Deceaseds.find(searchFilter);

  if (!searchResult) {
    return res.json([]);
  }

  const searchQuery = searchResult.map(async (deceased) => {
    const plot = await Plots.findOne({ _id: deceased.plotId });

    if (!plot) {
      return res
        .status(404)
        .json({ error: "System couldn't find corresponding plot" });
    }

    const lawn = await Lawns.findOne({ _id: plot.structureId });

    if (!lawn) {
      return res
        .status(404)
        .json({ error: "System couldn't find corresponding plot" });
    }
    let data = {
      name: deceased.name + " " + deceased.lastName,
      birthDate: deceased.birthDate,
      deathDate: deceased.deathDate,
      plotId: deceased.plotId,
      plotName: plot.plotName,
      lawn: lawn.lawnName,
    };

    if (deceased.middleName && deceased.suffix) {
      data = {
        ...data,
        name:
          deceased.name +
          " " +
          deceased.middleName +
          " " +
          deceased.lastName +
          " " +
          deceased.suffix,
      };
    } else if (deceased.middleName && !deceased.suffix) {
      data = {
        ...data,
        name:
          deceased.name + " " + deceased.middleName + " " + deceased.lastName,
      };
    } else if (!deceased.middleName && deceased.suffix) {
      data = {
        ...data,
        name: deceased.name + " " + deceased.lastName + " " + deceased.suffix,
      };
    }

    return data;
  });

  const resolvedData = await Promise.all(searchQuery);

  result.push(...resolvedData);

  return res.json(result);
});

// @desc - search query
// endpoint - /mapping/plots/:plotId
// private access
export const getPlotInfo = asyncHandler(async (req, res) => {
  const { plotId } = req.params;

  if (!plotId) {
    return res.status(400).json({ error: "Invalid Parameter" });
  }

  const plot = await Plots.findOne({ _id: plotId });

  if (!plot) {
    return res.status(404).json({ error: "No plot found" });
  }

  const lawn = await Lawns.findOne({ _id: plot.structureId });

  if (!lawn) {
    return res.status(404).json({ error: "No Structure found with the plot" });
  }

  const deceased = await Deceaseds.findOne({
    plotId: plot._id,
  });

  if (plot.status == "withInterment" && !deceased) {
    return res
      .status(404)
      .json({ error: "Unable to find occupant of the plot" });
  }

  let data = {
    plotId: plot._id,
    plotName: plot.plotName,
    plotStatus: plot.status,
    lawn: lawn.lawnName,
  };

  if (plot.status === "withInterment" && deceased) {
    data = {
      ...data,
      name: deceased.name + " " + deceased.middleName + " " + deceased.lastName,
      age: deceased.age,
      birthDate: deceased.birthDate,
      deathDate: deceased.deathDate,
    };
    if (deceased?.suffix) {
      data = {
        ...data,
        name: `${deceased.name} ${deceased.middleName} ${deceased.lastName} ${deceased.suffix}`,
      };
    }
  }
  return res.json(data);
});

export const getAreaPlots = asyncHandler(async (req, res) => {
  const { areaTypeName } = req.params; // meaning it can pertain to lawn, apartment or niche

  if (!areaTypeName) {
    return res
      .status(404)
      .json({ error: "Invalid Parameter: No Type Specified" });
  }

  const selectedArea = await Lawns.findOne({ lawnName: areaTypeName }); // if there is another type aside from lawn in the database do the samething for that

  if (!selectedArea) {
    // if nothing matched in Lawns collection it might e from other type juts do the samething
    return res.status(404).json({
      error: "Cannot find corresponding lawn",
    });
  }

  // if there's a match get all the plots refrenced to the id of matched area type
  const plots = await Plots.find({ structureId: selectedArea._id }).lean();

  if (!plots) {
    return res.status(404).json({ error: "No Plots Found" });
  }

  let data = [];

  plots.forEach((plot) => {
    if (plot.structureId.equals(selectedArea._id)) {
      data.push(plot);
    }
  });
  // pass the plots to the client
  return res.json({ data });
});
