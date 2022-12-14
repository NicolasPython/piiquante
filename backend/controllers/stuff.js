const Thing = require('../models/thing');
const fs = require('fs');

//manages likes and dislikes
exports.likeThing = (req, res, next) => {
    const nbLike = req.body.like;
    const userId = req.body.userId;
    const sauceId = req.params.id;

    let removeDislike = {$pull: {usersDisliked: userId}, $inc: {dislikes: -1}};
    let addDislike = {$push: {usersDisliked: userId}, $inc: {dislikes: +1}};
    let removeLike = {$pull: {usersLiked: userId}, $inc: {likes: -1}};
    let addLike = {$push: {usersLiked: userId}, $inc: {likes: +1}};

    Thing.findOne({_id: req.params.id})
    .then(sauce => {
        if(nbLike===1){
            if(sauce.usersLiked.includes(userId)){
                Thing.updateOne({ _id : sauceId}, removeLike)
                .then(() => res.status(200).json({message: "Like annulé"}))
                .catch(error => res.status(401).json({error}))
            }else{
                Thing.updateOne({ _id : sauceId}, addLike)
                .then(() => res.status(200).json({message: "Like enregistré"}))
                .catch(error => res.status(401).json({error}))
            }            
        }else if(nbLike===-1){
            if(sauce.usersDisliked.includes(userId)){
                Thing.updateOne({ _id : sauceId}, removeDislike)
                .then(() => res.status(200).json({message: "Dislike annulé"}))
                .catch(error => res.status(401).json({error}))
            }else{
                Thing.updateOne({ _id : sauceId}, addDislike)
                .then(() => res.status(200).json({message: "Dislike enregistré"}))
                .catch(error => res.status(401).json({error}))
            } 
        }else if(nbLike===0){
            if(sauce.usersLiked.includes(userId)){
                Thing.updateOne({ _id : sauceId}, removeLike)
                .then(() => res.status(200).json({message: "Like annulé"}))
                .catch(error => res.status(401).json({error}))
            }else if(sauce.usersDisliked.includes(userId)){
                Thing.updateOne({ _id : sauceId}, removeDislike)
                .then(() => res.status(200).json({message: "Dislike annulé"}))
                .catch(error => res.status(401).json({error}))
            }
        }})
    .catch(error => {res.status(404).json({ error })});
}

//Create new Thing in the DB
exports.createThing = (req, res, next) => {
    const thingObject = JSON.parse(req.body.sauce);
    delete thingObject.userId;
    const thing = new Thing({
        ...thingObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });  
    thing.save()
    .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
    .catch(error => { res.status(400).json({ error })})
};

//Update one Thing in he DB
exports.modifyThing = (req, res, next) => {
    const thingObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };  
    delete thingObject._userId;
    Thing.findOne({_id: req.params.id})
        .then((thing) => {
            if (thing.userId != req.auth.userId) {
                res.status(401).json({ message : 'Not authorized'});
            } else {
                Thing.updateOne({ _id: req.params.id}, { ...thingObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Objet modifié!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 };

//Get one Thing in the DB
exports.getOneThing = (req, res, next) => {
    Thing.findOne({_id: req.params.id})
        .then((thing) => {res.status(200).json(thing);})
        .catch((error) => {res.status(404).json({ error: error });
        });
};
  
//Delete one Thing in the DB
exports.deleteThing = (req, res, next) => {
    Thing.findOne({ _id: req.params.id})
        .then(thing => {
            if (thing.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = thing.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Thing.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
};

//Get all the Thing in the DB
exports.getAllStuff = (req, res, next) => {
    Thing.find().then((things) => {res.status(200).json(things);})
    .catch((error) => {res.status(400).json({error: error});});
};